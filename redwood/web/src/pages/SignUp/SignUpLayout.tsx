import {Flex} from '@chakra-ui/react'

const SignUpLayout: React.FC = ({children}) => (
  <Flex flexDir="column" flex="1" width="100%">
    {children}
  </Flex>
)

export default SignUpLayout
