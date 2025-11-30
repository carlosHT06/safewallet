
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AppTabs: undefined;
  Settings: undefined; 
};

export type TabParamList = {
  Home: undefined;
  AddExpense: { edit?: true; expenseId?: string } | undefined;
  Summary: undefined;
  Profile: undefined;
};
