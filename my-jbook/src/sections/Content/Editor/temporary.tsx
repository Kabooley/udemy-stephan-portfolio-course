import loader from "@monaco-editor/loader";

// loader.init() passes monaco instance
loader.init().then((monaco) => {
  const wrapper = document.getElementById("root");
  wrapper.style.height = "100vh";
  const properties = {
    value: "function hello() {\n\talert('Hello world!');\n}",
    language: "javascript"
  };

  // ここでたとえば
  // 
  // なにかエディタのモデルを作成して
  // Create new model
  // 好きな言語などを設定できる  
  const _model = monaco.editor.createModel(value, language, path);
//   Create new editor under domElement
  const _editor = monaco.editor.create(wrapper, properties);
  _editor.setModel(_model)

});