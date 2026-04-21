import React, { useState, useEffect, useRef } from 'react';
import { registerRootComponent } from 'expo';
import {
  StyleSheet, Text, View, FlatList, TextInput, Image,
  ActivityIndicator, StatusBar, Dimensions, ScrollView, TouchableOpacity,
  Alert, Animated, ImageBackground, RefreshControl, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Color Palette from the image
const COLORS = {
  primary: '#0C0420',
  secondary: '#5D3C64',
  accent1: '#7B466A',
  accent2: '#9F6496',
  accent3: '#D391B0',
  accent4: '#BA6E8F',
  pureWhite: '#FFFFFF',
  textGrey: '#B8C5D6',
  cardBorder: '#3A2A4A',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#E74C3C',
};

const ICON_HOME = 'https://cdn-icons-png.flaticon.com/512/25/25694.png';
const ICON_REPORT = 'https://cdn-icons-png.flaticon.com/512/1380/1380338.png';
const ICON_ADD = 'https://cdn-icons-png.flaticon.com/512/1828/1828817.png';
const ICON_PROFILE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
const ICON_SETTINGS = 'https://cdn-icons-png.flaticon.com/512/126/126472.png';
const ICON_DELETE = 'https://cdn-icons-png.flaticon.com/512/1214/1214428.png';
const ICON_EDIT = 'https://cdn-icons-png.flaticon.com/512/1159/1159633.png';

// CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
const API_URL = 'http://192.168.0.104/leohub_api';

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: 'Food',
    type: 'expense',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    startAnimation();
    calculateTotals();
  }, [activeTab, transactions]);

  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  const animatePress = (callback) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start(() => callback && callback());
  };

  const animateBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -10, duration: 150, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 150, useNativeDriver: true })
    ]).start();
  };

  const animateModal = () => {
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  // FETCH TRANSACTIONS FROM DATABASE (UPDATED to use _new)
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get_expense_transactions_new.php`);
      const text = await response.text();
      const data = JSON.parse(text);

      if (data.success && data.data) {
        setTransactions(data.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch transactions');
    }
    setLoading(false);
  };

  // ADD TRANSACTION TO DATABASE
  const addTransactionToDB = async () => {
    if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const formData = new FormData();
    formData.append('amount', newTransaction.amount);
    formData.append('category', newTransaction.category);
    formData.append('type', newTransaction.type);
    formData.append('note', newTransaction.note);
    formData.append('date', newTransaction.date);

    try {
      const response = await fetch(`${API_URL}/add_expense_transaction.php`, {
        method: 'POST',
        body: formData
      });
      const text = await response.text();
      const data = JSON.parse(text);

      if (data.success) {
        Alert.alert('Success', 'Transaction added successfully!');
        setModalVisible(false);
        fetchTransactions();
        setNewTransaction({
          amount: '',
          category: 'Food',
          type: 'expense',
          note: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('Add error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  // DELETE TRANSACTION FROM DATABASE
  const deleteTransactionFromDB = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/delete_expense_transaction.php?id=${id}`);
              const data = await response.json();
              if (data.success) {
                Alert.alert('Success', 'Transaction deleted successfully!');
                fetchTransactions();
              } else {
                Alert.alert('Error', data.error || 'Failed to delete');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Network error');
            }
          }
        }
      ]
    );
  };

  const calculateTotals = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    setTotalIncome(income);
    setTotalExpense(expense);
    setTotalBalance(income - expense);
  };

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const expenseData = new Array(12).fill(0);
    const incomeData = new Array(12).fill(0);

    transactions.forEach(t => {
      const date = new Date(t.date);
      const month = date.getMonth();
      if (t.type === 'expense') {
        expenseData[month] += parseFloat(t.amount);
      } else {
        incomeData[month] += parseFloat(t.amount);
      }
    });

    return { expenseData, incomeData, months };
  };

  const getCategoryData = () => {
    const categories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      if (!categories[t.category]) categories[t.category] = 0;
      categories[t.category] += parseFloat(t.amount);
    });
    return Object.keys(categories).map(key => ({
      name: key,
      amount: categories[key],
      percentage: totalExpense > 0 ? ((categories[key] / totalExpense) * 100).toFixed(1) : 0
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const AnimatedTouchable = ({ onPress, style, children }) => (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity onPress={() => animatePress(onPress)} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );

  // Dashboard Screen Component
  const DashboardScreen = () => {
    const { expenseData, months } = getMonthlyData();
    const categoryData = getCategoryData();
    const maxExpense = Math.max(...expenseData, 1);

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent3} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent3} />
        }
      >
        {/* Balance Card */}
        <Animated.View style={[styles.balanceCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Income</Text>
              <Text style={[styles.balanceItemValue, { color: COLORS.success }]}>+${totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Expense</Text>
              <Text style={[styles.balanceItemValue, { color: COLORS.danger }]}>-${totalExpense.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Monthly Spending Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Spending</Text>
          <Text style={styles.chartSubtitle}>Last 6 months</Text>
          <View style={styles.barChart}>
            {months.slice(6, 12).map((month, index) => (
              <View key={index} style={styles.barItem}>
                <View style={styles.barContainer}>
                  <Animated.View
                    style={[
                      styles.bar,
                      {
                        height: (expenseData[index + 6] / maxExpense) * 150,
                        backgroundColor: COLORS.accent3,
                        transform: [{ scaleY: scaleAnim }]
                      }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{month}</Text>
                <Text style={styles.barValue}>${expenseData[index + 6]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Expense by Category */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Expense by Category</Text>
          {categoryData.map((cat, idx) => (
            <View key={idx} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={styles.categoryBarContainer}>
                <Animated.View
                  style={[
                    styles.categoryBar,
                    {
                      width: `${cat.percentage}%`,
                      backgroundColor: COLORS.accent3,
                      transform: [{ scaleX: scaleAnim }]
                    }
                  ]}
                />
              </View>
              <Text style={styles.categoryAmount}>${cat.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentTransactions}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.transactionItem}
              onLongPress={() => deleteTransactionFromDB(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? COLORS.success : COLORS.danger }]}>
                <Text style={styles.transactionIconText}>{item.type === 'income' ? '💰' : '💸'}</Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCategory}>{item.category}</Text>
                <Text style={styles.transactionDate}>{item.date}</Text>
                {item.note ? <Text style={styles.transactionNote}>{item.note}</Text> : null}
              </View>
              <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeText : styles.expenseText]}>
                {item.type === 'income' ? '+' : '-'}${parseFloat(item.amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Reports Screen Component
  const ReportsScreen = () => {
    const { expenseData, months } = getMonthlyData();
    const categoryData = getCategoryData();
    const maxExpense = Math.max(...expenseData, 1);

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Spending Trend - Full Year */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Full Year Spending Trend</Text>
          <View style={styles.monthLabels}>
            {months.map((month, idx) => <Text key={idx} style={styles.monthLabel}>{month}</Text>)}
          </View>
          <View style={styles.trendContainer}>
            {expenseData.map((value, index) => (
              <View key={index} style={styles.trendBar}>
                <Animated.View
                  style={[
                    styles.trendFill,
                    {
                      height: (value / maxExpense) * 150,
                      backgroundColor: COLORS.accent3,
                      transform: [{ scaleY: scaleAnim }]
                    }
                  ]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Spending Insights */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Spending Insights</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Average Monthly Expense:</Text>
            <Text style={styles.statValue}>${(totalExpense / 12).toFixed(2)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Highest Spending Month:</Text>
            <Text style={styles.statValue}>${Math.max(...expenseData).toFixed(2)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Transactions:</Text>
            <Text style={styles.statValue}>{transactions.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Savings Rate:</Text>
            <Text style={styles.statValue}>{totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : 0}%</Text>
          </View>
        </View>

        {/* Top Spending Categories */}
        <View style={styles.categoryBreakdown}>
          <Text style={styles.sectionTitle}>Top Spending Categories</Text>
          {categoryData.sort((a, b) => b.amount - a.amount).slice(0, 5).map((cat, idx) => (
            <View key={idx} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryCardName}>{cat.name}</Text>
                <Text style={styles.categoryCardAmount}>${cat.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.categoryBarContainer}>
                <Animated.View
                  style={[
                    styles.categoryBar,
                    {
                      width: `${cat.percentage}%`,
                      backgroundColor: COLORS.accent3,
                      transform: [{ scaleX: scaleAnim }]
                    }
                  ]}
                />
              </View>
              <Text style={styles.categoryPercentage}>{cat.percentage}% of total expenses</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Add Transaction Modal
  const AddTransactionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, newTransaction.type === 'expense' && styles.activeTypeButton]}
              onPress={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
            >
              <Text style={[styles.typeButtonText, newTransaction.type === 'expense' && styles.activeTypeText]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, newTransaction.type === 'income' && styles.activeTypeButton]}
              onPress={() => setNewTransaction({ ...newTransaction, type: 'income' })}
            >
              <Text style={[styles.typeButtonText, newTransaction.type === 'income' && styles.activeTypeText]}>Income</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.textGrey}
              keyboardType="numeric"
              value={newTransaction.amount}
              onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <View style={styles.categoryGrid}>
                {['Food', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Healthcare', 'Salary', 'Bonus', 'Travel', 'Housing'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, newTransaction.category === cat && styles.activeCategoryChip]}
                    onPress={() => setNewTransaction({ ...newTransaction, category: cat })}
                  >
                    <Text style={[styles.categoryChipText, newTransaction.category === cat && styles.activeCategoryChipText]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note..."
              placeholderTextColor={COLORS.textGrey}
              multiline
              numberOfLines={3}
              value={newTransaction.note}
              onChangeText={(text) => setNewTransaction({ ...newTransaction, note: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textGrey}
              value={newTransaction.date}
              onChangeText={(text) => setNewTransaction({ ...newTransaction, date: text })}
            />
          </View>

          <AnimatedTouchable style={styles.submitButton} onPress={addTransactionToDB}>
            <Text style={styles.submitButtonText}>Add Transaction</Text>
          </AnimatedTouchable>
        </Animated.View>
      </View>
    </Modal>
  );

  // Profile Screen
  const ProfileScreen = () => (
    <ScrollView style={styles.profileContainer}>
      <Animated.View style={[styles.profileHeader, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.profileName}>Alex Johnson</Text>
        <Text style={styles.profileEmail}>alex.johnson@example.com</Text>
        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2026</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>
      </Animated.View>
      <View style={styles.profileOptions}>
        {['Edit Profile', 'Payment Methods', 'Budget Settings', 'Notifications'].map((item, idx) => (
          <AnimatedTouchable key={idx} style={styles.profileOption}>
            <Text style={styles.optionText}>{item}</Text>
            <Text style={styles.optionArrow}>→</Text>
          </AnimatedTouchable>
        ))}
      </View>
    </ScrollView>
  );

  // Settings Screen
  const SettingsScreen = () => (
    <ScrollView style={styles.settingsContainer}>
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Preferences</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Currency</Text>
          <Text style={styles.settingValue}>USD ($)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Theme</Text>
          <Text style={styles.settingValue}>Dark Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Language</Text>
          <Text style={styles.settingValue}>English</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Data Management</Text>
        <TouchableOpacity style={styles.settingItem} onPress={fetchTransactions}>
          <Text style={styles.settingText}>Sync with Server</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Export Data</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.settingsGroup}>
        <TouchableOpacity style={[styles.settingItem, styles.logoutItem]}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <DashboardScreen />;
      case 'Reports': return <ReportsScreen />;
      case 'Profile': return <ProfileScreen />;
      case 'Settings': return <SettingsScreen />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/cubes.png' }}
        style={styles.bgPattern}
        imageStyle={{ opacity: 0.05 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expense Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your finances smartly</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          {renderContent()}
        </Animated.View>

        <View style={styles.bottomNav}>
          {[
            { key: 'Dashboard', icon: ICON_HOME, label: 'Home' },
            { key: 'Reports', icon: ICON_REPORT, label: 'Reports' },
            { key: 'Profile', icon: ICON_PROFILE, label: 'Profile' },
            { key: 'Settings', icon: ICON_SETTINGS, label: 'Settings' }
          ].map((nav) => (
            <AnimatedTouchable
              key={nav.key}
              style={[styles.navItem, activeTab === nav.key && styles.activeNavItem]}
              onPress={() => { animateBounce(); setActiveTab(nav.key); }}
            >
              <Animated.Image
                source={{ uri: nav.icon }}
                style={[
                  styles.navIcon,
                  activeTab === nav.key && styles.activeNavIcon,
                  { transform: [{ translateY: bounceAnim }] }
                ]}
              />
              <Text style={[styles.navText, activeTab === nav.key && styles.activeNavText]}>
                {nav.label}
              </Text>
            </AnimatedTouchable>
          ))}
        </View>

        {/* Floating Add Button */}
        <AnimatedTouchable
          style={styles.fab}
          onPress={() => {
            animateBounce();
            setModalVisible(true);
            animateModal();
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </AnimatedTouchable>

        <AddTransactionModal />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.primary },
  bgPattern: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.pureWhite },
  headerSubtitle: { fontSize: 14, color: COLORS.accent3, marginTop: 5 },
  content: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textGrey, marginTop: 10 },

  // Bottom Navigation
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.secondary, paddingVertical: 10, paddingBottom: 25, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  activeNavItem: { borderTopWidth: 2, borderTopColor: COLORS.accent3 },
  navIcon: { width: 24, height: 24, tintColor: COLORS.textGrey, marginBottom: 4 },
  activeNavIcon: { tintColor: COLORS.accent3 },
  navText: { color: COLORS.textGrey, fontSize: 12 },
  activeNavText: { color: COLORS.accent3, fontWeight: 'bold' },

  // FAB Button
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent3, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { fontSize: 32, color: COLORS.primary, fontWeight: 'bold' },

  // Balance Card
  balanceCard: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 20, marginTop: 10, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  balanceLabel: { color: COLORS.textGrey, fontSize: 14, textAlign: 'center' },
  balanceAmount: { color: COLORS.pureWhite, fontSize: 42, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  balanceItem: { alignItems: 'center', flex: 1 },
  balanceDivider: { width: 1, backgroundColor: COLORS.cardBorder },
  balanceItemLabel: { color: COLORS.textGrey, fontSize: 12 },
  balanceItemValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },

  // Charts
  chartCard: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 15, marginBottom: 20 },
  chartTitle: { color: COLORS.pureWhite, fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  chartSubtitle: { color: COLORS.textGrey, fontSize: 12, marginBottom: 15 },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200 },
  barItem: { alignItems: 'center', flex: 1 },
  barContainer: { height: 150, justifyContent: 'flex-end', width: 30 },
  bar: { width: 30, borderRadius: 8, minHeight: 4 },
  barLabel: { color: COLORS.textGrey, fontSize: 12, marginTop: 8 },
  barValue: { color: COLORS.accent3, fontSize: 10, marginTop: 4 },

  // Categories
  categoryRow: { marginBottom: 15 },
  categoryName: { color: COLORS.pureWhite, fontSize: 14, marginBottom: 5 },
  categoryBarContainer: { height: 8, backgroundColor: COLORS.cardBorder, borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  categoryBar: { height: '100%', borderRadius: 4 },
  categoryAmount: { color: COLORS.accent3, fontSize: 12, textAlign: 'right' },

  // Transactions
  recentTransactions: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 15, marginBottom: 20 },
  sectionTitle: { color: COLORS.pureWhite, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionIconText: { fontSize: 20 },
  transactionInfo: { flex: 1 },
  transactionCategory: { color: COLORS.pureWhite, fontSize: 14, fontWeight: 'bold' },
  transactionDate: { color: COLORS.textGrey, fontSize: 11, marginTop: 2 },
  transactionNote: { color: COLORS.accent2, fontSize: 10, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  incomeText: { color: COLORS.success },
  expenseText: { color: COLORS.danger },

  // Stats
  statsCard: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 15, marginBottom: 20 },
  statsTitle: { color: COLORS.pureWhite, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  statLabel: { color: COLORS.textGrey, fontSize: 14 },
  statValue: { color: COLORS.accent3, fontSize: 16, fontWeight: 'bold' },

  // Category Breakdown
  categoryBreakdown: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 15, marginBottom: 20 },
  categoryCard: { marginBottom: 15, padding: 10, backgroundColor: COLORS.primary, borderRadius: 10 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryCardName: { color: COLORS.pureWhite, fontSize: 14, fontWeight: 'bold' },
  categoryCardAmount: { color: COLORS.accent3, fontSize: 14, fontWeight: 'bold' },
  categoryPercentage: { color: COLORS.textGrey, fontSize: 11, marginTop: 5 },

  // Trend
  monthLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, flexWrap: 'wrap' },
  monthLabel: { color: COLORS.textGrey, fontSize: 10, textAlign: 'center', width: 30 },
  trendContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180 },
  trendBar: { width: 25, alignItems: 'center', justifyContent: 'flex-end' },
  trendFill: { width: 25, borderRadius: 8, minHeight: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.primary, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.pureWhite, fontSize: 24, fontWeight: 'bold' },
  modalClose: { color: COLORS.accent3, fontSize: 24, fontWeight: 'bold' },

  // Forms
  typeSelector: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  typeButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.secondary, alignItems: 'center' },
  activeTypeButton: { backgroundColor: COLORS.accent3 },
  typeButtonText: { color: COLORS.textGrey, fontSize: 16 },
  activeTypeText: { color: COLORS.primary, fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: COLORS.pureWhite, fontSize: 14, marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 12, color: COLORS.pureWhite, fontSize: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryScroll: { flexGrow: 0 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 5 },
  categoryChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.cardBorder },
  activeCategoryChip: { backgroundColor: COLORS.accent3, borderColor: COLORS.accent3 },
  categoryChipText: { color: COLORS.textGrey, fontSize: 14 },
  activeCategoryChipText: { color: COLORS.primary, fontWeight: 'bold' },
  submitButton: { backgroundColor: COLORS.accent3, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },

  // Profile
  profileContainer: { flex: 1, padding: 20 },
  profileHeader: { alignItems: 'center', backgroundColor: COLORS.secondary, borderRadius: 20, padding: 20, marginBottom: 20 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.accent1, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 3, borderColor: COLORS.accent3 },
  avatarText: { fontSize: 50 },
  profileName: { color: COLORS.pureWhite, fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  profileEmail: { color: COLORS.textGrey, fontSize: 14, marginBottom: 20 },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center' },
  statNumber: { color: COLORS.accent3, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: COLORS.textGrey, fontSize: 12, marginTop: 5 },
  profileOptions: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 15 },
  profileOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  optionText: { color: COLORS.pureWhite, fontSize: 16 },
  optionArrow: { color: COLORS.accent3, fontSize: 18 },

  // Settings
  settingsContainer: { flex: 1, padding: 20 },
  settingsGroup: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 15, marginBottom: 20 },
  settingsGroupTitle: { color: COLORS.accent3, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  settingText: { color: COLORS.pureWhite, fontSize: 15 },
  settingValue: { color: COLORS.textGrey, fontSize: 14 },
  logoutItem: { borderBottomWidth: 0, marginTop: 10 },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});

registerRootComponent(ExpenseTracker);