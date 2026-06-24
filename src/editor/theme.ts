import type { EditorThemeClasses } from 'lexical'

export const theme: EditorThemeClasses = {
  root: 'flow-editor',
  paragraph: 'flow-p',
  heading: {
    h1: 'flow-h1',
    h2: 'flow-h2',
    h3: 'flow-h3',
    h4: 'flow-h4',
    h5: 'flow-h5',
    h6: 'flow-h6',
  },
  quote: 'flow-quote',
  list: {
    ol: 'flow-ol',
    ul: 'flow-ul',
    listitem: 'flow-li',
    nested: { listitem: 'flow-li-nested' },
    ulDepth: ['flow-ul-1', 'flow-ul-2', 'flow-ul-3', 'flow-ul-4'],
    olDepth: ['flow-ol-1', 'flow-ol-2', 'flow-ol-3', 'flow-ol-4'],
  },
  code: 'flow-code',
  link: 'flow-link',
  text: {
    bold: 'flow-bold',
    italic: 'flow-italic',
    underline: 'flow-underline',
    strikethrough: 'flow-strike',
    code: 'flow-code-inline',
  },
  table: 'flow-table',
  tableCell: 'flow-td',
  tableRow: 'flow-tr',
  tableCellHeader: 'flow-th',
}
