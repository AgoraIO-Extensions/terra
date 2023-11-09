# terra

terra is a shell of the code-gen flow: Parse AST -> Generate codes.

**Disclaimer**: This is not an officially supported Agora product.

## Get started

### Environment Setup

[node](https://nodejs.org/en/download) >=18

[yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

### Installing terra in your Project

> Currently, we do not provide an npm package for this repository. You should depend on `terra` from the GitHub repository using [yarn berry](https://github.com/yarnpkg/berry) as the package manager.
  
#### 1. Create a `.yarnrc.yml` file in your project directory:
```
echo "nodeLinker: node-modules" >> .yarnrc.yml
```
#### 2. Set `yarn` version to `berry`:
```yarn set version berry```
#### 3. Install `terra` from the GitHub repository:
``` 
yarn add <terra repo url>
# yarn add git@github.com:AgoraIO-Extensions/terra.git#head=main&workspace=terra
# yarn add git@github.com:AgoraIO-Extensions/terra.git#head=main&workspace=terra-core
```
#### 4. Install dependencies:
 ```yarn```

## Examples
- https://github.com/AgoraIO-Extensions/iris_web/blob/main/scripts/terra
- https://github.com/AgoraIO-Extensions/Agora-Flutter-SDK/tree/main/tool/terra

## License

The project is under the MIT license.
