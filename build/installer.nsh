; NSIS installer customization for Slate.
; On uninstall, remove the app's data (remembered folder and language) so a
; reinstall starts fresh. This does NOT touch the user's scripts, which live
; in the folder they chose.
!macro customUnInstall
  RMDir /r "$APPDATA\Slate"
!macroend
