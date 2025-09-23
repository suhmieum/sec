import type { Class, Student, Job, Transaction, Item } from '../types/index';

const STORAGE_KEYS = {
  CLASSES: 'vivaatown_classes',
  STUDENTS: 'vivaatown_students',
  JOBS: 'vivaatown_jobs',
  TRANSACTIONS: 'vivaatown_transactions',
  ITEMS: 'vivaatown_items',
  CURRENT_CLASS: 'vivaatown_current_class',
};

// Class Management
export const saveClass = (classData: Class): void => {
  const classes = getClasses();
  const existingIndex = classes.findIndex(c => c.id === classData.id);

  if (existingIndex >= 0) {
    classes[existingIndex] = classData;
  } else {
    classes.push(classData);
  }

  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
};

export const getClasses = (): Class[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CLASSES);
  return stored ? JSON.parse(stored) : [];
};

export const getClass = (id: string): Class | null => {
  const classes = getClasses();
  return classes.find(c => c.id === id) || null;
};

export const deleteClass = (id: string): void => {
  const classes = getClasses().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));

  // Also delete related data
  const students = getStudents().filter(s => s.classId !== id);
  const jobs = getJobs().filter(j => j.classId !== id);
  const transactions = getTransactions().filter(t => t.classId !== id);
  const items = getItems().filter(i => i.classId !== id);

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
};

// Current Class Management
export const setCurrentClass = (classId: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS, classId);
};

export const getCurrentClassId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_CLASS);
};

// Student Management
export const saveStudent = (student: Student): void => {
  const students = getStudents();
  const existingIndex = students.findIndex(s => s.id === student.id);

  if (existingIndex >= 0) {
    students[existingIndex] = student;
  } else {
    students.push(student);
  }

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getStudents = (classId?: string): Student[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const students = stored ? JSON.parse(stored) : [];

  if (classId) {
    return students.filter((s: Student) => s.classId === classId);
  }

  return students;
};

export const getStudent = (id: string): Student | null => {
  const students = getStudents();
  return students.find(s => s.id === id) || null;
};

export const deleteStudent = (id: string): void => {
  const students = getStudents().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

// Job Management
export const saveJob = (job: Job): void => {
  const jobs = getJobs();
  const existingIndex = jobs.findIndex(j => j.id === job.id);

  if (existingIndex >= 0) {
    jobs[existingIndex] = job;
  } else {
    jobs.push(job);
  }

  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
};

export const getJobs = (classId?: string): Job[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.JOBS);
  const jobs = stored ? JSON.parse(stored) : [];

  if (classId) {
    return jobs.filter((j: Job) => j.classId === classId);
  }

  return jobs;
};

export const deleteJob = (id: string): void => {
  const jobs = getJobs().filter(j => j.id !== id);
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
};

// Transaction Management
export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

  // Update student balances
  if (transaction.from !== 'system') {
    const fromStudent = getStudent(transaction.from);
    if (fromStudent) {
      fromStudent.balance -= transaction.amount;
      fromStudent.totalSpending += transaction.amount;
      saveStudent(fromStudent);
    }
  }

  if (transaction.to !== 'system') {
    const toStudent = getStudent(transaction.to);
    if (toStudent) {
      toStudent.balance += transaction.amount;
      toStudent.totalIncome += transaction.amount;
      saveStudent(toStudent);
    }
  }

  // Update class treasury if needed
  if (transaction.to === 'treasury' || transaction.from === 'treasury') {
    const classData = getClass(transaction.classId);
    if (classData) {
      if (transaction.to === 'treasury') {
        classData.treasury += transaction.amount;
      } else {
        classData.treasury -= transaction.amount;
      }
      saveClass(classData);
    }
  }
};

export const getTransactions = (classId?: string): Transaction[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  const transactions = stored ? JSON.parse(stored) : [];

  if (classId) {
    return transactions.filter((t: Transaction) => t.classId === classId);
  }

  return transactions;
};

// Item Management
export const saveItem = (item: Item): void => {
  const items = getItems();
  const existingIndex = items.findIndex(i => i.id === item.id);

  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }

  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
};

export const getItems = (classId?: string): Item[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
  const items = stored ? JSON.parse(stored) : [];

  if (classId) {
    return items.filter((i: Item) => i.classId === classId);
  }

  return items;
};

export const deleteItem = (id: string): void => {
  const items = getItems().filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
};