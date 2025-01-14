import {Image} from '@chakra-ui/image'
import {AspectRatio, AspectRatioProps, Box} from '@chakra-ui/layout'
import ReactPlayer from 'react-player'
import {cidToUrl} from 'src/lib/ipfs'
import {isLocalUrl} from 'src/lib/util'

const SquareBox = (props: AspectRatioProps) => (
  <AspectRatio
    ratio={1}
    bgColor="gray.800"
    borderRadius="lg"
    shadow="md"
    overflow="hidden"
    objectFit="contain"
    {...props}
  />
)

export default SquareBox

export const maybeCidToUrl: (value: string) => string = (value) => {
  if (isLocalUrl(value)) return value
  return cidToUrl(value)
}

export const PhotoBox = ({
  photo,
  ...props
}: AspectRatioProps & {photo: string}) => (
  <SquareBox {...props}>
    <Box>
      <Image
        src={maybeCidToUrl(photo)}
        alt="Profile Photo"
        objectFit="contain"
        width="100%"
        height="100%"
      />
    </Box>
  </SquareBox>
)

export const VideoBox = ({
  video,
  ...props
}: AspectRatioProps & {video: string}) => {
  return (
    <SquareBox
      {...props}
      // Hide annoying loading spinner https://stackoverflow.com/a/62786714/2141688
      sx={{
        'video::-webkit-media-controls': {
          visibility: 'hidden',
        },

        'video::-webkit-media-controls-enclosure': {
          visibility: 'visible',
        },
      }}
    >
      <ReactPlayer
        url={maybeCidToUrl(video)}
        controls
        width="100%"
        height="100%"
      />
    </SquareBox>
  )
}
