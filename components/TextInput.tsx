import { Ref, forwardRef } from 'react'
import { StyleSheet, TextInput as TextInputNative, TextInputProps, StyleProp, TextStyle, Text, View } from 'react-native'

interface InputProps extends TextInputProps {
  label: string
  style?: StyleProp<TextStyle>
}

const TextInput = ({
  label,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline,
  style,
  onChangeText,
  ...otherProps
}: InputProps,
ref: Ref<TextInputNative> | null): JSX.Element => {
  return (
    <View style={styles.wrapper}>
      <Text>{label}</Text>
      <TextInputNative
        ref={ref}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.textInput, style]}
        secureTextEntry={secureTextEntry}
        onChangeText={onChangeText}
        {...otherProps}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1
  },
  textInput: {
    fontSize: 14,
    marginVertical: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8
  }
})

export default forwardRef(TextInput)
