import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import CounterScreen from './screens/CounterScreen'

const App = () => {
    const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
        <StatusBar style='auto' />
        <Stack.Navigator initialRouteName='Counter'>
            <Stack.Screen name='Counter' component={CounterScreen} options={{ title: 'Counter' }} />
            <Stack.Screen />
        </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
