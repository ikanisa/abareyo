@ECHO OFF
SET DIR=%~dp0
SET WRAPPER_JAR=%DIR%\gradle\wrapper\gradle-wrapper.jar
IF NOT EXIST "%WRAPPER_JAR%" (
  ECHO Gradle wrapper JAR missing. Downloading...
  IF NOT EXIST "%DIR%\gradle\wrapper" (
    mkdir "%DIR%\gradle\wrapper"
  )
  powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/gradle/gradle-wrapper/8.4/gradle-wrapper-8.4.jar' -OutFile '%WRAPPER_JAR%'"
)
SET JAVA_CMD=%JAVA_HOME%\bin\java.exe
IF NOT EXIST "%JAVA_CMD%" SET JAVA_CMD=java
"%JAVA_CMD%" -Dorg.gradle.appname=gradlew -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*
