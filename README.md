# terra

terra is a shell of the code-gen flow: Parse AST -> Generate codes.

**Disclaimer**: This is not an officially supported Agora product.

## How to install terra to your project

#### Environment prepare

[node](https://nodejs.org/en/download) >=18

[yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

#### installation

- ```touch .yarnrc.yml```
- ```echo "httpsProxy: \"http://127.0.0.1:7890\"" >> .yarnrc.yml```
- ```echo "nodeLinker: node-modules" >> .yarnrc.yml```
- ```touch package.json```
- Add the package that is you want to package.json
- ```yarn set version berry```
- ```yarn```

#### some example
- render(https://github.com/AgoraIO-Extensions/iris_web/blob/main/scripts/terra)
- legacy(https://github.com/AgoraIO-Extensions/Agora-Flutter-SDK/tree/main/tool/terra)

#### some tips

- you can add `.yarn` directory into `.gitignore` file
- httpsProxy is optional

## License

The project is under the MIT license.
