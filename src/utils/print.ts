// PDF出力・印刷ユーティリティ

export function printDocument(elementId: string, title: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Print element not found');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('ポップアップがブロックされました。ポップアップを許可してください。');
    return;
  }

  const styles = `
    <style>
      @page {
        size: A4;
        margin: 15mm;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #333;
        background: white;
      }

      .document-container {
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
      }

      .document-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px double #333;
        padding-bottom: 20px;
      }

      .document-title {
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 8px;
        margin-bottom: 10px;
      }

      .document-number {
        font-size: 14px;
        color: #666;
      }

      .document-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
      }

      .customer-info, .company-info {
        width: 48%;
      }

      .customer-info h3, .company-info h3 {
        font-size: 14px;
        border-bottom: 1px solid #333;
        padding-bottom: 5px;
        margin-bottom: 10px;
      }

      .customer-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .customer-name::after {
        content: ' 御中';
        font-size: 14px;
        font-weight: normal;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      th, td {
        border: 1px solid #333;
        padding: 8px 10px;
        text-align: left;
      }

      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }

      .text-right {
        text-align: right;
      }

      .text-center {
        text-align: center;
      }

      .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
      }

      .grand-total {
        font-size: 16px;
        border: 2px solid #333;
      }

      .notes {
        margin-top: 30px;
        padding: 15px;
        border: 1px solid #ccc;
        background-color: #fafafa;
      }

      .notes h4 {
        margin-bottom: 10px;
        font-size: 12px;
      }

      .stamp-area {
        display: flex;
        justify-content: flex-end;
        margin-top: 30px;
      }

      .stamp {
        width: 60px;
        height: 60px;
        border: 2px solid #c00;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c00;
        font-weight: bold;
        margin-left: 20px;
      }

      .bank-info {
        margin-top: 30px;
        padding: 15px;
        border: 1px solid #333;
      }

      .bank-info h4 {
        margin-bottom: 10px;
        font-weight: bold;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .no-print {
          display: none !important;
        }
      }
    </style>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
        ${styles}
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // フォントの読み込みを待ってから印刷
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// PDFとしてダウンロード（印刷ダイアログでPDF保存を選択）
export function downloadAsPdf(elementId: string, filename: string) {
  printDocument(elementId, filename);
}

// 直接印刷
export function printElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  window.print();
}
