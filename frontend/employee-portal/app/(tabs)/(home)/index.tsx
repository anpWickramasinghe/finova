import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';

export default function HomeScreen() {
  const primary = useColor('primary');

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: 'center',
      }}
    >
      <Card>
        <View style={{ gap: 12 }}>
          <Text
            variant='heading'
            style={{
              textAlign: 'center',
              color: primary,
            }}
          >
            Welcome to Employee Portal ha haha
          </Text>
          <Text
            variant='body'
            style={{
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            Manage your leaves, overtime, and chat with colleagues.
          </Text>
        </View>
      </Card>
    </View>
  );
}
