import {contextBridge, ipcRenderer} from 'electron'
import type {QuizMeadowAPI} from '../shared/schema'
const api: QuizMeadowAPI = {
 bootstrap: () => ipcRenderer.invoke('bootstrap'), chooseLibrary: () => ipcRenderer.invoke('choose-library'), refresh: () => ipcRenderer.invoke('refresh'),
 start: config => ipcRenderer.invoke('start', config), save: session => ipcRenderer.invoke('save', session), discard: id => ipcRenderer.invoke('discard', id),
 finish: session => ipcRenderer.invoke('finish', session), settings: patch => ipcRenderer.invoke('settings', patch), export: format => ipcRenderer.invoke('export', format),
 revealLibrary: () => ipcRenderer.invoke('reveal-library'), revealData: () => ipcRenderer.invoke('reveal-data'), openSource: url => ipcRenderer.invoke('open-source', url),
 onLibraryChange: callback => {ipcRenderer.on('library:changed', callback); return () => ipcRenderer.removeListener('library:changed', callback)},
 onCloseRequest: callback => {const listener = async () => {try {await callback(); ipcRenderer.send('app:close-ready')} catch (error) {ipcRenderer.send('app:close-failed', error instanceof Error ? error.message : String(error))}}; ipcRenderer.on('app:prepare-close', listener); return () => ipcRenderer.removeListener('app:prepare-close', listener)}
}
contextBridge.exposeInMainWorld('quizmeadow', api)
