import {extendTheme} from '@chakra-ui/react'

const theme = extendTheme({
  components: {
    Link: {
      variants: {
        // you can name it whatever you want
        primary: ({colorScheme = 'blue'}) => ({
          color: `${colorScheme}.500`,
          _hover: {
            color: `${colorScheme}.400`,
          },
        }),
        btn: {
          color: 'purple.500',
          // fontWeight: 'bold',
          textAlign: 'center',
          _hover: {
            color: 'purple.800',
            textDecoration: 'none',
          },
        },
      },
      defaultProps: {
        // you can name it whatever you want
        variant: 'primary',
      },
    },
  },
})

export default theme
