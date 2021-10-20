import {
  Box,
  Button,
  Stack,
  SlideFade,
  ButtonGroup,
  useColorModeValue,
  CircularProgress,
  Text,
} from '@chakra-ui/react'
import { MetaTags, useMutation } from '@redwoodjs/web'
import { useEthers } from '@usedapp/core'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import ipfsClient from 'src/lib/ipfsClient'
import EditView from './EditView'
import ReviewView from './ReviewView'
import { SignupFieldValues } from './types'

const CREATE_UNSUBMITTED_PROFILE_MUTATION = gql`
  mutation CREATE_UNSUBMITTED_PROFILE($input: CreateUnsubmittedProfileInput!) {
    createUnsubmittedProfile(input: $input) {
      id
    }
  }
`

const SignUpPage = () => {
  const methods = useForm<SignupFieldValues>({ mode: 'onChange' })
  const { account } = useEthers()
  const [isReviewing, setIsReviewing] = React.useState(false)
  const [submitProgress, setSubmitProgress] = React.useState(0)

  const formValid = methods.formState.isValid && account != null

  const [submitMutation] = useMutation(CREATE_UNSUBMITTED_PROFILE_MUTATION)

  const submit = React.useCallback<SubmitHandler<SignupFieldValues>>(
    async (data) => {
      setSubmitProgress(0)
      const reportProgress = (bytes: number) =>
        setSubmitProgress(
          (100 * bytes) / (data.userSelfie.size + data.userVideo.size)
        )

      const uploadedSelfie = await ipfsClient.add(data.userSelfie as Blob, {
        progress: reportProgress,
      })
      const uploadedVideo = await ipfsClient.add(data.userVideo as Blob, {
        progress: (progress) => reportProgress(data.userSelfie.size + progress),
      })

      const selfieCID = uploadedSelfie.cid.toV1().toString()
      const videoCID = uploadedVideo.cid.toV1().toString()

      await submitMutation({
        variables: {
          input: {
            ethAddress: account,
            selfieCID,
            videoCID,
          },
        },
      })
    },
    []
  )

  let controlButtons = (
    <ButtonGroup pt="6" alignSelf="flex-end">
      {isReviewing ? (
        <>
          <Button onClick={() => setIsReviewing(false)}>Make Changes</Button>
          <Button colorScheme="blue" type="submit" disabled={!formValid}>
            Submit
          </Button>
        </>
      ) : (
        <Button
          colorScheme="teal"
          disabled={!formValid}
          onClick={() => setIsReviewing(true)}
        >
          Continue
        </Button>
      )}
    </ButtonGroup>
  )

  if (methods.formState.isSubmitting) {
    controlButtons = (
      <Stack align="center" justify="center" direction="row" pt="6">
        <CircularProgress value={submitProgress} />
        <Text>Submitting...</Text>
      </Stack>
    )
  }

  return (
    <>
      <MetaTags
        title="Create Account"
        description="Sign up for a Nym account"
      />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(submit)}>
          <SlideFade key={isReviewing.toString()} in={true}>
            <Stack maxW="xl" mx="auto">
              {isReviewing ? <ReviewView /> : <EditView />}
              {controlButtons}
            </Stack>
          </SlideFade>
        </form>
      </FormProvider>
    </>
  )
}

export default SignUpPage
