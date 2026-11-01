-- 把历史文件按扩展名补上自动标签（与 util.ts 的 autoTag 规则一致）
UPDATE files SET tags='图片' WHERE tags='' AND (
  lower(name) LIKE '%.png' OR lower(name) LIKE '%.jpg' OR lower(name) LIKE '%.jpeg' OR lower(name) LIKE '%.gif' OR
  lower(name) LIKE '%.webp' OR lower(name) LIKE '%.svg' OR lower(name) LIKE '%.bmp' OR lower(name) LIKE '%.ico' OR
  lower(name) LIKE '%.heic' OR lower(name) LIKE '%.avif' OR lower(name) LIKE '%.tif' OR lower(name) LIKE '%.tiff' OR
  lower(name) LIKE '%.psd' OR lower(name) LIKE '%.raw');

UPDATE files SET tags='视频' WHERE tags='' AND (
  lower(name) LIKE '%.mp4' OR lower(name) LIKE '%.mkv' OR lower(name) LIKE '%.mov' OR lower(name) LIKE '%.avi' OR
  lower(name) LIKE '%.webm' OR lower(name) LIKE '%.flv' OR lower(name) LIKE '%.wmv' OR lower(name) LIKE '%.m4v' OR
  lower(name) LIKE '%.mpeg' OR lower(name) LIKE '%.mpg' OR lower(name) LIKE '%.3gp');

UPDATE files SET tags='音频' WHERE tags='' AND (
  lower(name) LIKE '%.mp3' OR lower(name) LIKE '%.wav' OR lower(name) LIKE '%.flac' OR lower(name) LIKE '%.aac' OR
  lower(name) LIKE '%.ogg' OR lower(name) LIKE '%.m4a' OR lower(name) LIKE '%.opus' OR lower(name) LIKE '%.ape' OR
  lower(name) LIKE '%.wma' OR lower(name) LIKE '%.aiff');

UPDATE files SET tags='文档' WHERE tags='' AND (
  lower(name) LIKE '%.pdf' OR lower(name) LIKE '%.doc' OR lower(name) LIKE '%.docx' OR lower(name) LIKE '%.rtf' OR
  lower(name) LIKE '%.odt' OR lower(name) LIKE '%.pages' OR lower(name) LIKE '%.txt' OR lower(name) LIKE '%.md' OR
  lower(name) LIKE '%.log' OR lower(name) LIKE '%.epub' OR lower(name) LIKE '%.mobi' OR lower(name) LIKE '%.xls' OR
  lower(name) LIKE '%.xlsx' OR lower(name) LIKE '%.csv' OR lower(name) LIKE '%.ods' OR lower(name) LIKE '%.numbers' OR
  lower(name) LIKE '%.ppt' OR lower(name) LIKE '%.pptx' OR lower(name) LIKE '%.odp' OR lower(name) LIKE '%.key' OR
  lower(name) LIKE '%.wps');

UPDATE files SET tags='代码' WHERE tags='' AND (
  lower(name) LIKE '%.json' OR lower(name) LIKE '%.xml' OR lower(name) LIKE '%.html' OR lower(name) LIKE '%.htm' OR
  lower(name) LIKE '%.js' OR lower(name) LIKE '%.mjs' OR lower(name) LIKE '%.ts' OR lower(name) LIKE '%.jsx' OR
  lower(name) LIKE '%.tsx' OR lower(name) LIKE '%.py' OR lower(name) LIKE '%.java' OR lower(name) LIKE '%.go' OR
  lower(name) LIKE '%.rs' OR lower(name) LIKE '%.sh' OR lower(name) LIKE '%.yml' OR lower(name) LIKE '%.yaml' OR
  lower(name) LIKE '%.css' OR lower(name) LIKE '%.scss' OR lower(name) LIKE '%.sql' OR lower(name) LIKE '%.toml' OR
  lower(name) LIKE '%.ini' OR lower(name) LIKE '%.bat' OR lower(name) LIKE '%.ps1' OR lower(name) LIKE '%.php' OR
  lower(name) LIKE '%.rb' OR lower(name) LIKE '%.swift' OR lower(name) LIKE '%.kt' OR lower(name) LIKE '%.vue' OR
  lower(name) LIKE '%.lua' OR lower(name) LIKE '%.c' OR lower(name) LIKE '%.cpp' OR lower(name) LIKE '%.h');

UPDATE files SET tags='压缩包' WHERE tags='' AND (
  lower(name) LIKE '%.zip' OR lower(name) LIKE '%.rar' OR lower(name) LIKE '%.7z' OR lower(name) LIKE '%.tar' OR
  lower(name) LIKE '%.gz' OR lower(name) LIKE '%.bz2' OR lower(name) LIKE '%.xz' OR lower(name) LIKE '%.tgz' OR
  lower(name) LIKE '%.zst' OR lower(name) LIKE '%.cab');

UPDATE files SET tags='安装包' WHERE tags='' AND (
  lower(name) LIKE '%.exe' OR lower(name) LIKE '%.msi' OR lower(name) LIKE '%.apk' OR lower(name) LIKE '%.dmg' OR
  lower(name) LIKE '%.deb' OR lower(name) LIKE '%.rpm' OR lower(name) LIKE '%.iso' OR lower(name) LIKE '%.appimage' OR
  lower(name) LIKE '%.pkg' OR lower(name) LIKE '%.ipa' OR lower(name) LIKE '%.appx' OR lower(name) LIKE '%.crx');

UPDATE files SET tags='其他' WHERE tags='';
