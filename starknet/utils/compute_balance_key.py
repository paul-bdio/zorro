from starkware.starknet.public.abi import get_storage_var_address

balance_key = get_storage_var_address('balance')
print(f'Balance key: {balance_key}')
