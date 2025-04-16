import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { vi, beforeAll } from 'vitest';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// 添加全局测试配置
beforeAll(() => {
  // 设置全局测试环境变量
  process.env.NODE_ENV = 'test'
})

afterEach(() => {
  // 清理测试环境
  vi.clearAllMocks()
}) 