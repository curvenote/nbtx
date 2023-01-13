export enum KnownCellOutputMimeTypes {
  TextPlain = 'text/plain',
  TextHtml = 'text/html',
  TextLatex = 'text/latex',
  ImagePng = 'image/png',
  ImageBmp = 'image/bmp',
  ImageJpeg = 'image/jpeg',
  ImageSvg = 'image/svg+xml',
  ImageGif = 'image/gif',
  AppJson = 'application/json',
  AppGeoJson = 'application/geo+json',
  AppPlotly = 'application/vnd.plotly.v1+json',
  AppVega = 'application/vnd.vega.v5+json',
  AppVegaLite = 'application/vnd.vegalite.v3+json',
  AppVirtualDom = 'application/vdom.v1+json',
  AppJavascript = 'application/javascript',
  AppWidgetView = 'application/vnd.jupyter.widget-view+json',
  AppWidgetState = 'application/vnd.jupyter.widget-state+json',
  AppBokehLoad = 'application/vnd.bokehjs_load.v0+json',
  AppBokehExec = 'application/vnd.bokehjs_exec.v0+json',
}

export enum CELL_TYPES {
  raw = 'raw',
  markdown = 'markdown',
  code = 'code',
}
