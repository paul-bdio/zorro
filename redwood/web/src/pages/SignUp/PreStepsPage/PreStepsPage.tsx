import { CheckCircleIcon, QuestionIcon, UnlockIcon } from '@chakra-ui/icons'
import { Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import React from 'react'
import ConnectButton from 'src/components/ConnectButton/ConnectButton'

const PreStepsPage = () => {
  return (
    <Stack flex="1" width="100%">
      <Heading size="lg" pb="4" alignSelf="center">
        3 quick steps to become a web3 citizen!
      </Heading>
      <HStack spacing="6" flex="1" justify="space-between" alignItems="flex-start" width="100%">
        <Box borderWidth='1px' borderRadius='lg' flex="1" px="6" py="12">
          <UnlockIcon w={100} h={100} color="purple.500"/>
          <Heading size="md" mt="12" mb="6">
            Step 1. Connect your Ethereum wallet
          </Heading>
          <Text>
            To protect your privacy, connect an Ethereum wallet and{' '}
            <strong>create a new address</strong>.
          </Text>
          <ConnectButton colorScheme="purple" my="6">
            Connect wallet
          </ConnectButton>
        </Box>
        <Box borderWidth='1px' borderRadius='lg' flex="1" px="6" py="12">
          <CheckCircleIcon w={100} h={100} color="purple.500"/>
          <Heading size="md" mt="12" mb="6">
            Step 2. Allow camera and microphone access
          </Heading>
          <Text>Everyone who registers records a short video. These videos help ensure that each unique person only registers once.</Text>
          <Button colorScheme="purple" my="6">
            Allow Camera
          </Button>
        </Box>
        <Box borderWidth='1px' borderRadius='lg' flex="1" px="6" py="12">
          <QuestionIcon w={100} h={100} color="purple.500"/>
          <Heading size="md" mt="12" mb="6">
            Step 3. Record your web3 oath
          </Heading>
          <Text>Ready to be sworn in? Just read the words on the next screen.</Text>
          <Button colorScheme="purple" my="6">
            I'm ready, start recording
          </Button>
        </Box>
      </HStack>
    </Stack>
  )
}

export default PreStepsPage
