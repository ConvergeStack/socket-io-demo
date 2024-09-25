import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'danger'
  contentContainerStyle?: StyleProp<ViewStyle>
}

const Button = ({ title, onPress, variant, contentContainerStyle }: ButtonProps): JSX.Element => {
  let color = 'teal'
  let textColor = '#ffffff'

  if (variant === 'danger') {
    color = '#f44336'
    textColor = '#ffffff'
  }

  return (
    <View style={contentContainerStyle}>
      <TouchableOpacity onPress={onPress} style={[styles.wrapper, { backgroundColor: color }]}>
        <Text style={{ color: textColor }}>{title}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default Button
