; Personalización del instalador NSIS de Slate.
; Al desinstalar, borra los datos del programa (carpeta y idioma recordados)
; para que una reinstalación empiece de cero. NO toca los guiones del usuario,
; que viven en su propia carpeta elegida.
!macro customUnInstall
  RMDir /r "$APPDATA\Slate"
!macroend
