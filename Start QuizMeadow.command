#!/bin/zsh
set -e
cd "${0:A:h}"
if [[ -d "release/mac-arm64/QuizMeadow.app" ]]; then
  open "release/mac-arm64/QuizMeadow.app"
elif [[ -d node_modules ]]; then
  npm run build
  npm start
else
  print "Run npm install and npm run package:mac once, then double-click this launcher."
  read -r "?Press Return to close."
fi
