import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.vfs

pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Regular.ttf',
    italics: 'Roboto-Regular.ttf',
    bolditalics: 'Roboto-Regular.ttf',
  },
  fangzhen: {
    normal: 'fzhei-jt.ttf',
    bold: 'fzhei-jt.ttf',
    italics: 'fzhei-jt.ttf',
    bolditalics: 'fzhei-jt.ttf',
  },
}

export default pdfMake
