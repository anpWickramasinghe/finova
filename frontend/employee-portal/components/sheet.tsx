import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './ui/text';
import { useAuth } from '@/providers/auth-context';
import { useRouter } from 'expo-router';
import { LogOut, User } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';

export default function SheetScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const primary = useColor('primary');

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: primary }]}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text variant='heading' style={styles.name}>
          {user?.name || 'User'}
        </Text>
        <Text variant='body' style={styles.email}>
          {user?.email || 'email@example.com'}
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <LogOut size={24} color="#ef4444" />
          <Text style={styles.menuText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    opacity: 0.6,
    fontSize: 16,
  },
  section: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    gap: 12,
  },
  menuText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  }
});
