import { PrismaClient } from '@prisma/client';
import fs from 'fs';
// Ensure 'csv-parse' is installed (e.g., `pnpm add csv-parse`). 
// For older versions of csv-parse (<5.0.0), you might also need `@types/csv-parse`.
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

// --- Configuration --- 
// TODO: 用户需要修改这里的配置
const CSV_FILE_PATH = 'path/to/your/data.csv'; //  CSV 文件路径
const BATCH_SIZE = 100; //  每次批量插入数据库的记录数

//  定义 CSV 列名到 Prisma 模型字段的映射
//  定义 CSV 列名到 Prisma 模型字段的映射
//  确保这里的 prismaModelFieldName 与你的 schema.prisma 中的模型字段名一致
//  type 用于基本的数据类型转换
interface ColumnMapInfo {
    prismaModelFieldName: string;
    type: 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime';
}

const COLUMN_MAPPING: { [csvColumnName: string]: ColumnMapInfo } = {
    // 例如: '用户ID': { prismaModelFieldName: 'userId', type: 'String' },
    //       '订单金额': { prismaModelFieldName: 'amount', type: 'Float' },
    //       '创建日期': { prismaModelFieldName: 'createdAt', type: 'DateTime' },
    //       '是否有效': { prismaModelFieldName: 'isActive', type: 'Boolean' },
};

//  指定要导入数据的 Prisma 模型名称 (与 schema.prisma 中的 model 名称一致)
//  例如: const PRISMA_MODEL_NAME = 'user';
const PRISMA_MODEL_NAME = 'your_model_name_here'; // TODO: 用户需要修改

// --- Helper Functions --- 

/**
 * 将字符串值根据其目标类型转换为相应的数据类型。
 * @param value The string value from CSV.
 * @param type The target data type ('String', 'Int', 'Float', 'Boolean', 'DateTime').
 * @returns The converted value.
 */
function convertType(value: string, type: string): any {
    if (value === null || value === undefined || value.trim() === '') return null;

    const trimmedValue = value.trim();

    switch (type) {
        case 'Int':
            const intValue = parseInt(trimmedValue, 10);
            return isNaN(intValue) ? null : intValue;
        case 'Float':
            const floatValue = parseFloat(trimmedValue);
            return isNaN(floatValue) ? null : floatValue;
        case 'Boolean':
            return trimmedValue.toLowerCase() === 'true' || trimmedValue === '1';
        case 'DateTime':
            const dateValue = new Date(trimmedValue);
            return isNaN(dateValue.getTime()) ? null : dateValue;
        case 'String':
        default:
            return trimmedValue;
    }
}

/**
 * 从 CSV 文件读取和解析数据。
 */
async function readCsvData(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const records: any[] = [];
        const parser = fs.createReadStream(filePath)
            .pipe(parse({
                columns: true, //  将第一行作为列名
                skip_empty_lines: true,
                trim: true,
            }));

        parser.on('readable', () => {
            let record;
            while ((record = parser.read()) !== null) {
                records.push(record);
            }
        });

        parser.on('error', (err: Error) => reject(err));
        parser.on('end', () => resolve(records));
    });
}

/**
 * 将 CSV 记录映射到 Prisma 模型数据。
 */
function mapRecordToPrismaData(record: any): any | null {
    const prismaData: any = {};
    let hasValidData = false;

    for (const csvColumnName in COLUMN_MAPPING) {
        if (record.hasOwnProperty(csvColumnName)) {
            const mappingInfo = COLUMN_MAPPING[csvColumnName as keyof typeof COLUMN_MAPPING];
            const convertedValue = convertType(record[csvColumnName], mappingInfo.type);
            prismaData[mappingInfo.prismaModelFieldName] = convertedValue;

            if (convertedValue !== null && convertedValue !== undefined) {
                hasValidData = true;
            }
        }
    }

    return hasValidData ? prismaData : null;
}

/**
 * 将数据批量写入数据库。
 */
async function batchInsertData(data: any[]): Promise<{ success: number; failed: number }> {
    const modelAccessor = prisma as any; // Use 'as any' for dynamic model access
    if (!modelAccessor[PRISMA_MODEL_NAME] || typeof modelAccessor[PRISMA_MODEL_NAME].createMany !== 'function') {
        throw new Error(`Prisma model "${PRISMA_MODEL_NAME}" or its 'createMany' method not found. Please check PRISMA_MODEL_NAME configuration and ensure the model exists.`);
    }
    const createManyFunc = modelAccessor[PRISMA_MODEL_NAME].createMany;

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        try {
            const result = await createManyFunc({
                data: batch,
                skipDuplicates: true, //  如果希望跳过重复记录 (基于唯一约束)
            });
            totalSuccess += result.count;
            console.log(`成功插入 ${result.count} 条记录 (批次 ${i / BATCH_SIZE + 1})`);
        } catch (error) {
            totalFailed += batch.length;
            console.error(`批次 ${i / BATCH_SIZE + 1} 插入失败:`, error);
            //  可以根据需要决定是否继续处理其他批次
        }
    }

    return { success: totalSuccess, failed: totalFailed };
}

// --- Main Execution --- 

async function main() {
    console.log('开始从 CSV 文件导入数据...');

    if (Object.keys(COLUMN_MAPPING).length === 0 || PRISMA_MODEL_NAME === 'your_model_name_here') {
        console.error('错误: 请在脚本中配置 COLUMN_MAPPING 和 PRISMA_MODEL_NAME。');
        return;
    }
    if (CSV_FILE_PATH === 'path/to/your/data.csv') {
        console.error('错误: 请在脚本中配置 CSV_FILE_PATH。');
        return;
    }

    try {
        const csvRecords = await readCsvData(CSV_FILE_PATH);
        if (csvRecords.length === 0) {
            console.log('CSV 文件中没有找到数据或文件为空。');
            return;
        }
        console.log(`从 CSV 文件成功读取 ${csvRecords.length} 条记录。`);

        const prismaData = csvRecords.map(mapRecordToPrismaData).filter(data => data !== null);
        console.log(`转换得到 ${prismaData.length} 条可用于 Prisma 插入的数据。`);

        if (prismaData.length > 0) {
            const result = await batchInsertData(prismaData);
            console.log(`数据导入完成。成功: ${result.success} 条，失败: ${result.failed} 条`);
        } else {
            console.log('没有可导入的数据。');
        }

    } catch (error) {
        console.error('数据导入过程中发生错误:', error);
    } finally {
        await prisma.$disconnect();
        console.log('数据库连接已断开。');
    }
}

main()
    .catch((e) => {
        console.error('脚本执行失败:', e);
        prisma.$disconnect().finally(() => process.exit(1));
    });