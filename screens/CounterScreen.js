import React, { useCallback, useState } from 'react'
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const CounterScreen = () => {
    const [ count, setCount ] = useState(0);
    const [ incrementValue, setIncrementValue ] = useState(1);
    const [ decrementValue, setDecrementValue ] = useState(1);
    const [ maxValue, setMaxValue ] = useState(null);
    const [ minValue, setMinValue ] = useState(null);

    // load settings and count when screen is focused
    useFocusEffect(
        useCallback(() => {
            loadSettings();
            loadCount();
        }, [])
    );

    const loadSettings = async () => {
        try {
            const increment = await AsyncStorage.getItem('incrementValue');
            const decrement = await AsyncStorage.getItem('decrementValue');
            const max = await AsyncStorage.getItem('maxValue');
            const min = await AsyncStorage.getItem('minValue');

            if (increment !== null) setIncrementValue(parseInt(increment));
            if (decrement !== null) setDecrementValue(parseInt(decrement));
            if (max !== null) setMaxValue(parseInt(max));
            if (min !== null) setMinValue(parseInt(min));
        } catch (error) {
            console.error("Error loading settings: ", error);
        }
    }

    const savedCount = async (newCount) => {
        try {
            await AsyncStorage.setItem('count', newCount.toString());
        } catch (error) {
            console.error('Error saving count: ', error);
        }
    }

    const loadCount = async () => {
        try {
            const savedCount = await AsyncStorage.getItem('count');
            if(savedCount !== null){
                setCount(parseInt(savedCount))
            }
        } catch (error) {
            console.error("Error loading count:", error);
        }
    }

    const handleIncrement = () => {
        const newCount = count + incrementValue;
        if(maxValue !== null && newCount > maxValue){
            Alert.alert('Limit reached', `Maximum value is ${maxValue}`);
            return;
        }
        setCount(newCount);
        savedCount(newCount)
    }

    const handleDecrement = () => {
        const newCount = count - incrementValue;
        if(maxValue !== null && newCount < minValue){
            Alert.alert('Limit reached', `Minimum value is ${minValue}`);
            return;
        }
        setCount(newCount);
        savedCount(newCount)
    }
  return (
    <View style={styles.container}>
        <View style={styles.countContainer}>
            <Text style={styles.counterLabel}>Current Count</Text>
            <Text style={styles.counterValue}>{count}</Text>
            <TouchableOpacity onPress={handleDecrement}>-{decrementValue}</TouchableOpacity>
            <TouchableOpacity onPress={handleIncrement}>-{incrementValue}</TouchableOpacity>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        color: '#000'
    },
    countContainer: {
        //
    },
    counterLabel: {
        //
    },
    counterValue: {
        //
    },
})

export default CounterScreen
