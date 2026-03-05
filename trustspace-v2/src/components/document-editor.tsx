"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save, Download, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Plus, Trash2, Table } from "lucide-react";
import * as XLSX from "xlsx";

interface DocumentEditorProps {
  file: {
    id: string;
    name: string;
    type: "docx" | "xlsx" | "pptx" | "txt";
    blobUrl?: string;
  };
  onSave: (content: string | any[][]) => void;
  onCancel: () => void;
}

// Word/DOCX Editor
function WordEditor({ file, onSave, onCancel }: DocumentEditorProps) {
  const [content, setContent] = useState("<p>Loading...</p>");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file.blobUrl) {
      // Load file content
      fetch(file.blobUrl)
        .then(res => res.text())
        .then(text => {
          if (text.startsWith('<')) {
            setContent(text);
          } else {
            // Plain text to HTML
            setContent(`<p>${text.replace(/\n/g, '</p><p>')}</p>`);
          }
        })
        .catch(() => {
          setContent("<p>New document</p>");
        });
    } else {
      setContent("<p>New document</p>");
    }
  }, [file]);

  const execCmd = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    if (editorRef.current) {
      onSave(editorRef.current.innerHTML);
    }
  };

  const handleExportDocx = () => {
    // Create a simple HTML file that can be opened in Word
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${file.name}</title></head>
      <body>${content}</body>
      </html>
    `;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-gray-50 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => execCmd('bold')}><Bold className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => execCmd('italic')}><Italic className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => execCmd('underline')}><Underline className="w-4 h-4" /></Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => execCmd('insertUnorderedList')}><List className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => execCmd('insertOrderedList')}><ListOrdered className="w-4 h-4" /></Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => execCmd('justifyLeft')}><AlignLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => execCmd('justifyCenter')}><AlignCenter className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => execCmd('justifyRight')}><AlignRight className="w-4 h-4" /></Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExportDocx}>
          <Download className="w-4 h-4 mr-1" /> Export as .doc
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} className="bg-[#0066FF]">
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
      </div>
      
      {/* Editor */}
      <div className="flex-1 overflow-auto p-8 bg-gray-100">
        <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-[800px] p-12">
          <div
            ref={editorRef}
            contentEditable
            className="outline-none prose max-w-none"
            style={{ minHeight: "600px" }}
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
          />
        </div>
      </div>
    </div>
  );
}

// Excel/XLSX Editor
function ExcelEditor({ file, onSave, onCancel }: DocumentEditorProps) {
  const [data, setData] = useState<any[][]>([[]]);
  const [activeCell, setActiveCell] = useState<{r: number, c: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (file.blobUrl) {
      fetch(file.blobUrl)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
          // Ensure at least 10 rows and 5 columns
          const paddedData = padData(jsonData as any[][], 10, 5);
          setData(paddedData);
          setIsLoading(false);
        })
        .catch(() => {
          setData(createEmptyGrid(10, 5));
          setIsLoading(false);
        });
    } else {
      setData(createEmptyGrid(10, 5));
      setIsLoading(false);
    }
  }, [file]);

  const createEmptyGrid = (rows: number, cols: number): any[][] => {
    return Array(rows).fill(null).map(() => Array(cols).fill(''));
  };

  const padData = (data: any[][], minRows: number, minCols: number): any[][] => {
    const padded = [...data];
    // Pad rows
    while (padded.length < minRows) {
      padded.push(Array(minCols).fill(''));
    }
    // Pad columns
    return padded.map(row => {
      const newRow = [...row];
      while (newRow.length < minCols) {
        newRow.push('');
      }
      return newRow;
    });
  };

  const updateCell = (row: number, col: number, value: string) => {
    const newData = [...data];
    if (!newData[row]) newData[row] = [];
    newData[row][col] = value;
    setData(newData);
  };

  const addRow = () => {
    const cols = data[0]?.length || 5;
    setData([...data, Array(cols).fill('')]);
  };

  const addColumn = () => {
    setData(data.map(row => [...row, '']));
  };

  const deleteRow = (rowIndex: number) => {
    if (data.length <= 1) return;
    setData(data.filter((_, i) => i !== rowIndex));
  };

  const deleteColumn = (colIndex: number) => {
    if (data[0]?.length <= 1) return;
    setData(data.map(row => row.filter((_, i) => i !== colIndex)));
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, file.name);
  };

  const handleSave = () => {
    onSave(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066FF] mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="w-4 h-4 mr-1" /> Add Row
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="w-4 h-4 mr-1" /> Add Column
        </Button>
        {activeCell && (
          <>
            <Button variant="outline" size="sm" onClick={() => deleteRow(activeCell.r)} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-1" /> Delete Row
            </Button>
            <Button variant="outline" size="sm" onClick={() => deleteColumn(activeCell.c)} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-1" /> Delete Column
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1" /> Export .xlsx
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} className="bg-[#0066FF]">
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="border-collapse">
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Row header */}
                <td className="border border-gray-300 bg-gray-100 w-10 text-center text-sm text-gray-500 font-medium select-none">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`border border-gray-300 p-0 min-w-[100px] ${
                      activeCell?.r === rowIndex && activeCell?.c === colIndex 
                        ? 'ring-2 ring-[#0066FF] ring-inset' 
                        : ''
                    } ${rowIndex === 0 ? 'bg-gray-50 font-semibold' : ''}`}
                    onClick={() => setActiveCell({r: rowIndex, c: colIndex})}
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="w-full px-2 py-1 border-0 outline-none bg-transparent text-sm"
                      onFocus={() => setActiveCell({r: rowIndex, c: colIndex})}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="p-2 border-t bg-gray-50 text-sm text-gray-500 flex justify-between">
        <span>{data.length} rows × {data[0]?.length || 0} columns</span>
        {activeCell && (
          <span>Cell: {String.fromCharCode(65 + activeCell.c)}{activeCell.r + 1}</span>
        )}
      </div>
    </div>
  );
}

export function DocumentEditor(props: DocumentEditorProps) {
  if (props.file.type === 'docx' || props.file.type === 'txt') {
    return <WordEditor {...props} />;
  }
  if (props.file.type === 'xlsx') {
    return <ExcelEditor {...props} />;
  }
  return <div>Unsupported file type</div>;
}
