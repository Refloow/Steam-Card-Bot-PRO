## 1. ERR_REQUIRE_ESM

This error is caused in case of using bricked (old/outdated) version of node.js. <br>
Sometimes there are backwards compatibility issues that are not project related rather due environtment changes.
### Solution
In case you are having this error troubleshoot it as following:
1. [DEBUG] Check your node version (open command prompt and type node -v)<br>
    In case version is v14 upgrade to stable v15.2.1 [Download here](https://nodejs.org/dist/v15.2.1/node-v15.2.1-x64.msi)

2. [SOLUTION 1] After upgrading node restart your enviroment machine/server, download & install the script again with right version of node

1. [SOLUTION 2] Repair existing script on new node <br>
    Delete node_modules folder including package.lock file<br>
    This might cause other issues since package.lock contains instructions for script to install.<br>
    Package.lock might change in case of running installation on non supported version of node so to avoid furthure errors replace existing with package.lock file from repository <br> run install.bat to install correctly.
