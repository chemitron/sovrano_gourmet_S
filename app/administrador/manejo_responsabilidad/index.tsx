import { Picker } from '@react-native-picker/picker';
import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from '../../../components/GradientBackground';
import BodyBoldText from '../../../components/typography/BodyBoldText';
import { ROLES } from '../../../constants/roles';
import { auth } from '../../../services/firestore/firebase';
import { fetchAllUsers, updateUserRoleByUsername } from '../../../services/firestore/userService';
import { User } from '../../../src/types';
import { logError } from "../../../utils/logger";

export default function manejo_responsabilidadIndex() {
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);
  const [users, setUsers] = useState<User[]>([]);

  // Load all users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await fetchAllUsers();
        setUsers(userList);
      } catch (err) {
        logError('Error loading users:', err);
      }
    };
    loadUsers();
  }, []);

  const handleUpdate = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No authenticated user found.');
        return;
      }

      if (!username) {
        Alert.alert('Error', 'Please select a username.');
        return;
      }

      await updateUserRoleByUsername(username, selectedRole);
      await auth.currentUser?.getIdToken(true); // refresh token

      Alert.alert('Success', `Role updated to "${selectedRole}" for ${username}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      Alert.alert('Error', message);
    }
  };

  return (
    <>
      {/* ⭐ Expo Router Header */}
      <Stack.Screen
        options={{
          title: "Asignar responsabilidad",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <View style={styles.container}>

          {/* Username Picker */}
          <View style={styles.pickerWrapper}>
            <BodyBoldText style={styles.label}>Nombre de usuario</BodyBoldText>

            <Picker
              selectedValue={username}
              onValueChange={(value) => setUsername(value)}
              style={[styles.picker, { width: '100%' }]}
              itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
            >
              <Picker.Item label="Selecciona un usuario..." value="" />

              {users
                .filter((user) => {
                  if (!user.lastLogin) return false;
                  const lastLoginDate = new Date(user.lastLogin);
                  const oneYearAgo = new Date();
                  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                  return lastLoginDate >= oneYearAgo;
                })
                .slice()
                .sort((a, b) => a.username.localeCompare(b.username))
                .map((user) => (
                  <Picker.Item
                    key={user.email}
                    label={`${user.username} (${user.role})`}
                    value={user.username}
                  />
                ))}
            </Picker>
          </View>

          {/* Role Picker */}
          <View style={styles.pickerWrapper}>
            <BodyBoldText style={styles.label}>Selecciona la responsabilidad</BodyBoldText>

            <Picker
              selectedValue={selectedRole}
              onValueChange={(itemValue) => setSelectedRole(itemValue)}
              style={[styles.picker, { width: '100%' }]}
              itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
            >
              {Object.values(ROLES).map((role) => (
                <Picker.Item key={role} label={role} value={role} />
              ))}
            </Picker>
          </View>

          {/* Update Button */}
          <Button_style2 title="Update Role" onPress={handleUpdate} />

        </View>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  picker: {
    ...Platform.select({
      ios: {
        height: 150,
        justifyContent: 'center',
      },
      android: {
        height: 50,
        justifyContent: 'center',
      },
    }),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00796b',
  },
  pickerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerItem: {
    fontSize: 16,
    color: 'black',
  },
});
