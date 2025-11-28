// src/types/navigation.ts
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AppTabs: undefined;
};

export type TabParamList = {
  Home: undefined;
  AddExpense?: { edit?: true; expenseId?: string } | undefined;
  Summary: undefined;
};
