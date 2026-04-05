import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Supported Formats", href: "#formats" },
  { title: "Data Structure", href: "#structure" },
  { title: "Upload Process", href: "#upload" },
  { title: "Column Mapping", href: "#mapping" },
  { title: "Tips", href: "#tips" },
];

const UploadCSV = () => {
  return (
    <DocsLayout 
      title="Upload CSV Data" 
      description="Import spreadsheets and CSV files to analyze your financial data."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/connect/manual", title: "Manual Data Entry" }}
    >
      <section id="formats" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Supported Formats</h2>
        <p className="text-vesta-navy-muted mb-4">Vesta accepts the following file formats:</p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">CSV</strong> - Comma-separated values</li>
          <li><strong className="text-vesta-navy">XLSX / XLS</strong> - Microsoft Excel files</li>
          <li><strong className="text-vesta-navy">PDF</strong> - Bank statements and financial reports</li>
          <li><strong className="text-vesta-navy">DOC / DOCX</strong> - Microsoft Word documents</li>
          <li><strong className="text-vesta-navy">TXT</strong> - Plain text files</li>
          <li><strong className="text-vesta-navy">Images</strong> - PNG, JPG, WEBP (with OCR support)</li>
        </ul>
      </section>

      <section id="structure" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Data Structure</h2>
        <p className="text-vesta-navy-muted mb-4">
          For best results, your file should include these columns:
        </p>
        <div className="border border-vesta-navy/10 bg-white rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 text-left text-vesta-navy">Column</th>
                <th className="py-2 text-left text-vesta-navy">Required</th>
                <th className="py-2 text-left text-vesta-navy">Format</th>
              </tr>
            </thead>
            <tbody className="text-vesta-navy-muted">
              <tr className="border-b border-white/5">
                <td className="py-2">Date</td>
                <td className="py-2">Yes</td>
                <td className="py-2">YYYY-MM-DD or MM/DD/YYYY</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2">Amount</td>
                <td className="py-2">Yes</td>
                <td className="py-2">Numeric (negative for expenses)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2">Description</td>
                <td className="py-2">Recommended</td>
                <td className="py-2">Text</td>
              </tr>
              <tr>
                <td className="py-2">Category</td>
                <td className="py-2">Optional</td>
                <td className="py-2">Text</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="upload" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Upload Process</h2>
        <ol className="list-decimal list-inside text-vesta-navy-muted space-y-3">
          <li>Navigate to your Vesta dashboard</li>
          <li>Find the <strong className="text-vesta-navy">"Upload Financial Data or Enter Manually"</strong> card</li>
          <li>Make sure the <strong className="text-vesta-navy">"Upload Document"</strong> tab is selected</li>
          <li>Drag and drop your file into the upload area, or click <strong className="text-vesta-navy">"Choose Files"</strong></li>
          <li>Wait for the file to be processed automatically</li>
          <li>Check the <strong className="text-vesta-navy">"AI Insights"</strong> tab for your analysis results</li>
        </ol>
      </section>

      <section id="mapping" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Column Mapping</h2>
        <p className="text-vesta-navy-muted mb-4">
          If your columns don't match our expected format, you can manually map them:
        </p>
        <div className="border border-vesta-navy/10 bg-white rounded-xl p-4 mb-4">
          <p className="text-sm text-vesta-navy-muted">
            💡 <strong className="text-vesta-navy">AI-Powered:</strong> Vesta uses AI to automatically detect and map common column names.
          </p>
        </div>
      </section>

      <section id="tips" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Tips for Clean Data</h2>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Remove any summary rows or totals</li>
          <li>Ensure dates are consistent throughout</li>
          <li>Use negative values for expenses</li>
          <li>Remove currency symbols from amounts</li>
          <li>Keep header row in the first row</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default UploadCSV;
