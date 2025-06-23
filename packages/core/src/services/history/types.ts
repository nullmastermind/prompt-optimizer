/**
 * 提示词记录类型
 */
export type PromptRecordType = 'optimize' | 'iterate';

/**
 * 提示词记录接口
 */
export interface PromptRecord {
  /** 记录ID */
  id: string;
  /** 原始提示词 */
  originalPrompt: string;
  /** 优化/迭代后的提示词 */
  optimizedPrompt: string;
  /** 记录类型 */
  type: PromptRecordType;
  /** 所属的提示词链ID */
  chainId: string;
  /** 在链中的版本号 */
  version: number;
  /** 前一个版本ID */
  previousId?: string;
  /** 时间戳 */
  timestamp: number;
  /** 使用的模型key */
  modelKey: string;
  /** 使用的提示词ID */
  templateId: string;
  /** 迭代时的修改说明 */
  iterationNote?: string;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 历史记录链类型
 */
export interface PromptRecordChain {
  chainId: string;
  rootRecord: PromptRecord;
  currentRecord: PromptRecord;
  versions: PromptRecord[];
}

/**
 * 历史记录管理器接口
 */
export interface IHistoryManager {
  /** 添加记录 */
  addRecord(record: PromptRecord): void;
  /** 获取所有记录 */
  getRecords(): PromptRecord[];
  /** 获取指定记录 */
  getRecord(id: string): PromptRecord;
  /** 删除记录 */
  deleteRecord(id: string): void;
  /** 获取迭代链 */
  getIterationChain(recordId: string): PromptRecord[];
  /** 清除所有记录 */
  clearHistory(): void;
  /** 获取所有记录链 */
  getAllChains(): PromptRecordChain[];
  /** 创建新的记录链 */
  createNewChain(record: Omit<PromptRecord, 'chainId' | 'version' | 'previousId'>): PromptRecordChain;
  /** 添加迭代记录 */
  addIteration(params: {
    chainId: string;
    originalPrompt: string;
    optimizedPrompt: string;
    iterationNote: string;
    modelKey: string;
    templateId: string;
  }): PromptRecordChain;
} 