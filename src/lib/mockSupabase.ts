// ✅ CREATE THIS NEW FILE (it doesn't exist yet)

import { MOCK_PATIENTS, MOCK_ASSESSMENTS, MOCK_PREDICTIONS, MOCK_USERS } from './mockData';

const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const mockSupabase = {
  from: (table: string) => {
    const getTableData = () => {
      switch (table) {
        case 'users': return [...MOCK_USERS];
        case 'patients': return [...MOCK_PATIENTS];
        case 'patient_assessments': return [...MOCK_ASSESSMENTS];
        case 'predictions': return [...MOCK_PREDICTIONS];
        default: return [];
      }
    };

    return {
      select: (columns: string = '*') => {
        const tableData = getTableData();
        
        return {
          eq: (column: string, value: any) => ({
            maybeSingle: async () => {
              await delay();
              const data = tableData.find((item: any) => item[column] === value) || null;
              return { data, error: null };
            },
            single: async () => {
              await delay();
              const data = tableData.find((item: any) => item[column] === value);
              return { data: data || null, error: data ? null : { message: 'Not found' } };
            },
          }),
          order: (column: string, options?: any) => ({
            limit: async (count: number) => {
              await delay();
              return { data: tableData.slice(0, count), error: null };
            },
          }),
          limit: async (count: number) => {
            await delay();
            return { data: tableData.slice(0, count), error: null };
          },
        };
      },
      insert: (values: any) => ({
        select: () => ({
          single: async () => {
            await delay();
            const newItem = { 
              ...values, 
              id: `new-${Date.now()}`, 
              created_at: new Date().toISOString(), 
              updated_at: new Date().toISOString() 
            };
            console.log('✅ Mock insert:', table, newItem);
            return { data: newItem, error: null };
          },
        }),
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              await delay();
              const updated = { ...values, id: value, updated_at: new Date().toISOString() };
              console.log('✅ Mock update:', table, updated);
              return { data: updated, error: null };
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => async () => {
          await delay();
          console.log('✅ Mock delete:', table, { column, value });
          return { data: null, error: null };
        },
      }),
    };
  },
  auth: {
    getUser: async () => {
      const storedUser = localStorage.getItem('mockUser');
      if (storedUser) {
        return { data: { user: JSON.parse(storedUser) }, error: null };
      }
      return { data: { user: null }, error: null };
    },
  },
};