import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { StoredExecutionReport } from './execution-report-store';
import { buildReportTableRows } from './format-report-table';

const STATUS_COLORS: Record<string, string> = {
  Passed: 'FF4ADE80',
  Failed: 'FFF87171',
  Skipped: 'FFFBBF24',
  Executed: 'FF38BDF8',
  'Not Run': 'FF94A3B8',
};

function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/*?:[\]]/g, '_').slice(0, 31) || 'Report';
}

async function writeExcelSheet(
  sheet: ExcelJS.Worksheet,
  rows: ReturnType<typeof buildReportTableRows>,
  title: string,
  timestamp: string,
): Promise<void> {
  sheet.addRow(['Test', title]);
  sheet.addRow(['Generated', timestamp]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(['Module', 'Status', 'Description']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  sheet.columns = [
    { key: 'module', width: 22 },
    { key: 'status', width: 14 },
    { key: 'description', width: 70 },
  ];

  for (const row of rows) {
    const dataRow = sheet.addRow([row.module, row.status, row.description]);
    const statusColor = STATUS_COLORS[row.status];
    if (statusColor) {
      dataRow.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor },
      };
    }
  }

  sheet.views = [{ state: 'frozen', ySplit: 4 }];
}

function buildDocxTable(rows: ReturnType<typeof buildReportTableRows>): Table {
  const header = new TableRow({
    tableHeader: true,
    children: ['Module', 'Status', 'Description'].map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true })],
            }),
          ],
        }),
    ),
  });

  const body = rows.map(
    (row) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(row.module)],
          }),
          new TableCell({
            children: [new Paragraph(row.status)],
          }),
          new TableCell({
            children: [new Paragraph(row.description)],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...body],
  });
}

/** Write flow execution reports to an Excel workbook. */
export async function exportReportsToExcel(
  reports: StoredExecutionReport[],
  outputPath: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RSAUTOMATION';
  workbook.created = new Date();

  if (reports.length === 0) {
    const sheet = workbook.addWorksheet('Flow Execution');
    sheet.addRow(['Module', 'Status', 'Description']);
    sheet.addRow(['(none)', 'Not Run', 'No flow execution reports captured']);
  } else if (reports.length === 1) {
    const stored = reports[0];
    const sheet = workbook.addWorksheet('Flow Execution');
    await writeExcelSheet(
      sheet,
      buildReportTableRows(stored.report),
      stored.testTitle,
      stored.timestamp,
    );
  } else {
    for (const stored of reports) {
      const sheet = workbook.addWorksheet(sanitizeSheetName(stored.testTitle));
      await writeExcelSheet(
        sheet,
        buildReportTableRows(stored.report),
        stored.testTitle,
        stored.timestamp,
      );
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
}

/** Write flow execution reports to a Word document. */
export async function exportReportsToDocx(
  reports: StoredExecutionReport[],
  outputPath: string,
): Promise<void> {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: 'Flow Execution Summary',
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Module flow outcomes in table format.',
          italics: true,
        }),
      ],
    }),
  ];

  if (reports.length === 0) {
    children.push(
      new Paragraph('No flow execution reports were captured in this run.'),
    );
  } else {
    for (const stored of reports) {
      children.push(
        new Paragraph({
          text: stored.testTitle,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${stored.projectName} · ${stored.timestamp}` }),
          ],
        }),
        buildDocxTable(buildReportTableRows(stored.report)),
        new Paragraph(''),
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
}

/** Export both Excel and DOCX artifacts for stored reports. */
export async function exportExecutionReportArtifacts(
  reports: StoredExecutionReport[],
  outputDir: string,
): Promise<{ excelPath: string; docxPath: string }> {
  const excelPath = path.join(outputDir, 'flow-execution-summary.xlsx');
  const docxPath = path.join(outputDir, 'flow-execution-summary.docx');

  await exportReportsToExcel(reports, excelPath);
  await exportReportsToDocx(reports, docxPath);

  return { excelPath, docxPath };
}
