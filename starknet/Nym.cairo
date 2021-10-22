%lang starknet
%builtins pedersen range_check ecdsa

from starkware.cairo.common.math import assert_not_zero, assert_not_equal
from starkware.cairo.common.uint256 import Uint256, uint256_check, uint256_not
from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.starknet.common.syscalls import get_caller_address
from starkware.starknet.common.storage import Storage

# TODOS
# - initialize self_address_var
# - implement `transfer_from` call in `challenge`
# - import IERC20
# - test challenge procedure
# - pay out bounty for accurate challenges

# Bonus TODOS
# - self approval via bounty
# - appeal adjudication decisions to kleros
# - privacy via nyms
# - support a list of notaries, adding/removing notaries
# - multisig (hoping someone else does this for us)

# Necessary before any launch
# - much more extensive tests

# Whoever gets to it:
# - write js bindings

# member notary_address : felt Not necessary since is part of chain history
# TODO: maybe better not to use this pattern for profiles
struct ProfilePropertyEnum:
    member cid_low : felt
    member cid_high : felt
    member address : felt  # starknet address
    member created_timestamp : felt

    member status : felt  # one of ProfileStatusEnum

    # track who the challenger is so we can pay them if they prove to be right
    member challenge_evidence : felt
    member challenger_address : felt
end

# Abusing a struct as an enum
struct ProfileStatusEnum:
    member submitted_via_notary : felt
    member challenged : felt
    member deemed_valid : felt
    member deemed_invalid : felt
end

@storage_var
func is_initialized_var() -> (res : felt):
end

# There's no syscall yet for getting a contract's own address, so we store
# our own here and set it during initialization
@storage_var
func self_address_var() -> (res : felt):
end

# Stores the address of the ERC20 token that we touch
@storage_var
func token_address_var() -> (res : felt):
end

# TODO: in actuality, we want to maintain a list of valid notaries
@storage_var
func notary_address_var() -> (res : felt):
end

@storage_var
func adjudicator_address_var() -> (res : felt):
end

# Maps from user's ethereum address to profile properties
# TODO: decide what we want the key to be (using eth address right now.)
# TODO: decide if want to map into some bigger struct that includes
# other information about the profile, like whether or not it is challenged, etc
@storage_var
func profiles_var(eth_address : felt, profile_property : felt) -> (res : felt):
end

# internal index mapping from starknet address to eth address. necessary for is_human
@storage_var
func eth_address_lookup_var(address : felt) -> (eth_address : felt):
end

@external
func initialize{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        notary_address : felt, adjudicator_address):
    let (is_initialized) = is_initialized_var.read()
    assert is_initialized = 0
    is_initialized_var.write(1)

    notary_address_var.write(notary_address)
    adjudicator_address_var.write(adjudicator_address)
    return ()
end

@external
func submit_via_notary{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        ecdsa_ptr : SignatureBuiltin*, syscall_ptr : felt*}(
        eth_address : felt, profile_cid : Uint256, address : felt, created_timestamp : felt):
    alloc_locals
    # local storage_ptr : Storage* = storage_ptr
    assert_initialized()

    assert_caller_is_notary()
    local syscall_ptr : felt* = syscall_ptr
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr = range_check_ptr
    local storage_ptr : Storage* = storage_ptr

    # Zero can mean 'false' for us, so we can simplify our logic by avoiding
    # overloading the meaning of 0x0
    assert_not_zero(eth_address)
    assert_not_zero(address)
    uint256_check(profile_cid)
    local range_check_ptr = range_check_ptr
    assert_uint256_is_not_zero(profile_cid)

    assert_profile_does_not_exist(eth_address)
    assert_address_is_unused(address)

    # XXX: The ethereum address should sign the cid, and we should verify
    # that signature here. Otherwise, someone could claim someone else's
    # eth address, which could lead to confusion. Also, they could grief
    # the owner of the eth address by submitting an invalid profile to lock
    # them out of proving their personhood with that eth address.

    profiles_var.write(eth_address, ProfilePropertyEnum.cid_low, profile_cid.low)
    profiles_var.write(eth_address, ProfilePropertyEnum.cid_high, profile_cid.high)
    profiles_var.write(eth_address, ProfilePropertyEnum.address, address)
    profiles_var.write(
        eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.submitted_via_notary)

    # Starknet doesn't yet have a timestamp opcode, but according to them it's hopefully coming in a few weeks
    # For now, we can trust the notary to include it accurately, and the profile could be challenged if it is not accurate.
    profiles_var.write(eth_address, ProfilePropertyEnum.created_timestamp, created_timestamp)

    eth_address_lookup_var.write(address, eth_address)

    return ()
end

# evidence is ascii (could be url, could be text)
@external
func challenge{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        eth_address : felt, evidence : felt):
    assert_profile_exists(eth_address)

    let (status : felt) = get_profile_value(eth_address, ProfilePropertyEnum.status)

    # don't let people challenge a profile which was already challenged
    assert_not_equal(status, ProfileStatusEnum.challenged)

    profiles_var.write(eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.challenged)
    let (challenger_address) = get_caller_address()
    profiles_var.write(eth_address, ProfilePropertyEnum.challenger_address, challenger_address)
    profiles_var.write(eth_address, ProfilePropertyEnum.challenge_evidence, evidence)

    # XXX: need to require a deposit from challenger, but starknet doesn't
    # have native value transfers yet
    # transfer_from(challenger_address)

    return ()
end

@external
func adjudicate{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        eth_address : felt, is_valid : felt):
    alloc_locals
    assert_caller_is_adjudicator()
    local syscall_ptr : felt* = syscall_ptr
    assert_profile_exists(eth_address)

    let (status : felt) = get_profile_value(eth_address, ProfilePropertyEnum.status)
    # Can only adjudicate something that was challenged
    assert status = ProfileStatusEnum.challenged

    if is_valid == 1:
        profiles_var.write(eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.deemed_valid)
    else:
        profiles_var.write(
            eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.deemed_invalid)
        # TODO: pay challenger
    end

    return ()
end

@view
func get_profile_value{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        eth_address : felt, index : felt) -> (res : felt):
    let (res) = profiles_var.read(eth_address, index)
    return (res)
end

@view
func get_is_person{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        address) -> (is_person : felt):
    alloc_locals
    let (local eth_address) = eth_address_lookup_var.read(address)
    local storage_ptr : Storage* = storage_ptr
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr = range_check_ptr
    assert_profile_exists(eth_address)

    let (status : felt) = get_profile_value(eth_address, ProfilePropertyEnum.status)

    # Statuses conidered registered: submitted_via_notary, deemed_valid
    # Statuses considered unregistered: challenged, deemed_invalid
    let val = (status - ProfileStatusEnum.submitted_via_notary) * (status - ProfileStatusEnum.deemed_valid)
    if val == 0:
        return (is_person=1)
    else:
        return (is_person=0)
    end
end

# Guards

@view
func assert_initialized{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}():
    let (is_initialized) = is_initialized_var.read()
    assert is_initialized = 1
    return ()
end

@view
func assert_profile_exists{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        eth_address : felt):
    alloc_locals
    let (cid_low) = profiles_var.read(eth_address, ProfilePropertyEnum.cid_low)
    let (cid_high) = profiles_var.read(eth_address, ProfilePropertyEnum.cid_high)
    local storage_ptr : Storage* = storage_ptr
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr = range_check_ptr

    assert_uint256_is_not_zero(Uint256(cid_low, cid_high))
    return ()
end

@view
func assert_profile_does_not_exist{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(eth_address : felt):
    let (cid_low) = profiles_var.read(eth_address, ProfilePropertyEnum.cid_low)
    let (cid_high) = profiles_var.read(eth_address, ProfilePropertyEnum.cid_high)
    assert cid_low = 0
    assert cid_high = 0
    return ()
end

@view
func assert_caller_is_notary{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
        ):
    let (notary_address) = notary_address_var.read()
    let (caller_address) = get_caller_address()
    assert notary_address = caller_address
    return ()
end

@view
func assert_caller_is_adjudicator{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
        ):
    let (adjudicator_address) = adjudicator_address_var.read()
    let (caller_address) = get_caller_address()
    assert adjudicator_address = caller_address
    return ()
end

@view
func assert_address_is_unused{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        address : felt):
    let (eth_address) = eth_address_lookup_var.read(address)
    assert eth_address = 0
    return ()
end

@view
func log(x : felt) -> (x : felt):
    return (x)
end

func assert_uint256_is_not_zero(x : Uint256):
    if x.low == 0:
        assert_not_zero(x.high)
    end
    if x.high == 0:
        assert_not_zero(x.low)
    end
    return ()
end