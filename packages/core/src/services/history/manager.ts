import { IHistoryManager, PromptRecord, PromptRecordChain } from './types';
import { HistoryError, RecordNotFoundError, StorageError, RecordValidationError } from './errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * 历史记录管理器实现
 */
export class HistoryManager implements IHistoryManager {
  private readonly storageKey = 'prompt_history';
  private readonly maxRecords = 50; // 最多保存50条记录

  constructor() {
    try {
      // 验证存储是否可用
      const testKey = '_test_storage_';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      console.error('存储不可用:', error);
      throw new StorageError('存储不可用', 'storage');
    }
  }

  /**
   * 添加记录
   */
  addRecord(record: PromptRecord): void {
    try {
      this.validateRecord(record);
      const history = this.getRecords();
      history.unshift(record);
      this.saveToStorage(history.slice(0, this.maxRecords));
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new StorageError('添加记录失败', 'write');
    }
  }

  /**
   * 获取所有记录
   */
  getRecords(): PromptRecord[] {
    try {
      const historyStr = localStorage.getItem(this.storageKey);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      throw new StorageError('获取历史记录失败', 'read');
    }
  }

  /**
   * 获取指定记录
   */
  getRecord(id: string): PromptRecord {
    const history = this.getRecords();
    const record = history.find(r => r.id === id);
    if (!record) {
      throw new RecordNotFoundError('记录不存在', id);
    }
    return record;
  }

  /**
   * 删除记录
   */
  deleteRecord(id: string): void {
    const records = this.getRecords();
    const index = records.findIndex(record => record.id === id);
    if (index === -1) {
      throw new RecordNotFoundError('记录不存在', id);
    }
    records.splice(index, 1);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error) {
      throw new StorageError('删除记录失败', 'delete');
    }
  }

  /**
   * 获取迭代链
   */
  getIterationChain(recordId: string): PromptRecord[] {
    const history = this.getRecords();
    const chain: PromptRecord[] = [];
    let currentId = recordId;

    while (currentId) {
      const record = history.find(r => r.id === currentId);
      if (!record) break;
      
      chain.unshift(record);
      currentId = record.previousId ?? '';
    }

    return chain;
  }

  /**
   * 清除所有记录
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('清除历史记录失败:', error);
      throw new StorageError('清除历史记录失败', 'delete');
    }
  }

  /**
   * 验证记录
   */
  private validateRecord(record: PromptRecord): void {
    const errors: string[] = [];

    if (!record.id) errors.push('缺少记录ID');
    if (!record.originalPrompt) errors.push('缺少原始提示词');
    if (!record.optimizedPrompt) errors.push('缺少优化后的提示词');
    if (!record.type) errors.push('缺少记录类型');
    if (!record.chainId) errors.push('缺少记录链ID');
    if (!record.version) errors.push('缺少版本号');
    if (!record.timestamp) errors.push('缺少时间戳');
    if (!record.modelKey) errors.push('缺少模型标识');
    if (!record.templateId) errors.push('缺少提示词标识');

    if (errors.length > 0) {
      throw new RecordValidationError('记录验证失败', errors);
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(records: PromptRecord[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error) {
      throw new StorageError('保存历史记录失败', 'write');
    }
  }

  /**
   * 创建新的记录链（初始优化）
   */
  createNewChain(record: Omit<PromptRecord, 'chainId' | 'version' | 'previousId'>): PromptRecordChain {
    const chainId = uuidv4();
    const newRecord: PromptRecord = {
      ...record,
      chainId,
      version: 1,
      previousId: undefined
    };
    
    this.addRecord(newRecord);
    return this.getChain(chainId);
  }

  /**
   * 添加迭代记录
   */
  addIteration(params: {
    chainId: string;
    originalPrompt: string;
    optimizedPrompt: string;
    iterationNote?: string;
    modelKey: string;
    templateId: string;
  }): PromptRecordChain {
    const chain = this.getChain(params.chainId);
    const latest = chain.currentRecord;

    const newRecord: PromptRecord = {
      ...params,
      id: uuidv4(),
      chainId: params.chainId,
      type: 'iterate',
      version: latest.version + 1,
      previousId: latest.id,
      timestamp: Date.now()
    };

    this.addRecord(newRecord);
    return this.getChain(params.chainId);
  }

  /**
   * 获取完整记录链
   */
  getChain(chainId: string): PromptRecordChain {
    const allRecords = this.getRecords();
    const chainRecords = allRecords.filter(r => r.chainId === chainId);
    
    if (chainRecords.length === 0) {
      throw new RecordNotFoundError('记录链不存在', chainId);
    }

    const sorted = chainRecords.sort((a, b) => a.version - b.version);
    
    return {
      chainId,
      rootRecord: sorted[0],
      currentRecord: sorted[sorted.length - 1],
      versions: sorted
    };
  }

  /**
   * 获取所有记录链
   */
  getAllChains(): PromptRecordChain[] {
    const chains = new Map<string, PromptRecord[]>();
    const allRecords = this.getRecords();

    // 按chainId分组
    for (const record of allRecords) {
      const chain = chains.get(record.chainId) || [];
      chain.push(record);
      chains.set(record.chainId, chain);
    }

    // 先按chainId排序，再按version排序
    return Array.from(chains.entries())
      .sort(([chainId1], [chainId2]) => chainId1.localeCompare(chainId2))
      .map(([_, records]) => {
        const sorted = records.sort((a, b) => a.version - b.version);
        return {
          chainId: sorted[0].chainId,
          rootRecord: sorted[0],
          currentRecord: sorted[sorted.length - 1],
          versions: sorted
        };
      });
  }
}

// 导出单例实例
export const historyManager = new HistoryManager(); 