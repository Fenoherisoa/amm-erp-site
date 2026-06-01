import { Text, View, StyleSheet, Image } from 'react-native';

export default function AssetExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>
        Local files and assets example
      </Text>

      <Image
        style={styles.logo}
        source={{ uri: 'https://via.placeholder.com/128' }}
      />
    </View>
  );
}
