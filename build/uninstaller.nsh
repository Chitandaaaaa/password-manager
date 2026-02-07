!macro customUnInstall
MessageBox MB_YESNO "Delete all password data? Data cannot be recovered." IDYES deleteData IDNO skipDelete
deleteData:
RMDir /r "$APPDATA\password-manager"
RMDir /r "$LOCALAPPDATA\password-manager"
DetailPrint "Data deleted"
Goto endUninstall
skipDelete:
DetailPrint "Data kept"
endUninstall:
!macroend
