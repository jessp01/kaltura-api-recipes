var Router = module.exports = require('express').Router();
var CodeBuilders = require('../lucy-langs/builders/builders.js');

var Async = require('async');
var EJS = require('ejs');
var FS = require('fs');
var Path = require('path');
var XMLParser = require('xml2js').parseString;

var Recipes = require('../recipes/recipes.js');

var CodeTemplates = require('../code_templates/code-templates.js');
var SchemaXML = FS.readFileSync(Path.join(__dirname, '../api_schema.xml'), 'utf8');
var Schema = null;
XMLParser(SchemaXML, function(err, result) {
  if (err) throw err;
  result = result.xml;
  Schema = {classes: {}, services: {}};

  result.services[0].service.forEach(function(service) {
    var serviceJS = Schema.services[service.$.name] = {actions: {}};
    var actions = service.action;
    actions.forEach(function(action) {
      var actionJS = serviceJS.actions[action.$.name] = {parameters: {}};
      if (!action.param) return;
      action.param.forEach(function(param) {
        var paramJS = actionJS.parameters[param.$.name] = {type: param.$.type};
      });
    });
  });

  result.classes[0].class.forEach(function(cls) {
    var classJS = Schema.classes[cls.$.name] = {properties: {}};
    var props = cls.property || [];
    if (cls.$.base) {
      var copyBaseProps = function(baseName) {
        var baseClass = result.classes[0].class.filter(function(baseClass) {return baseName === baseClass.$.name })[0];
        if (baseClass.property) props = props.concat(baseClass.property);
        if (baseClass.$.base) copyBaseProps(baseClass.$.base);
      }
      copyBaseProps(cls.$.base);
    }
    props.forEach(function(prop) {
      var propJS = classJS.properties[prop.$.name] = {};
      if (prop.$.type.indexOf('Kaltura') === 0) {
        propJS.$ref = '#/classes/' + prop.$.type;
      } else {
        propJS.type = prop.$.type;
      }
    });
  });
});

Router.use(require('body-parser').json());

Router.use(function(req, res, next) {
  if (!Schema) return res.status(500).send('Schema not ready');
  else next();
})

Router.use('/:recipe', function(req, res, next) {
  if (!Recipes[req.params.recipe]) return res.status(404).send('Recipe ' + req.params.recipe + ' not found.');
  else next();
})

Router.get('/:recipe', function(req, res) {
  res.render('recipe', {recipe: Recipes[req.params.recipe]});
});

Router.post('/:recipe/code', function(req, res) {
  buildRecipe(req, res, function(err, files) {
    if (err) return res.status(500).send('Error building recipe');
    else res.json(files);
  });
});

var buildRecipe = function(req, res, callback) {
  var recipe = Recipes[req.params.recipe];
  var actions = recipe.actions;
  var views = recipe.views;
  var language = req.body.language;
  CodeBuilders.Recipe.fixAnswers(req.body.answers, function(err, answers) {
    if (err) return res.status(500).send('Error parsing answers');
    var buildParams = {answers: answers, actions: {}, views: {}};
    buildParams.main = recipe.pages[0];
    buildParams.action_language = language;
    buildParams.view_language = language === 'php' ? 'html-php' : 'html-angular';
    actions.forEach(function(action) {
      var codeParams = {parameters: [], service: action.service, action: action.action}
      var actionKey = action.action.indexOf('Action') === -1 ? action.action
            : action.action.substring(0, action.action.length - 6);
      var actionSchema = Schema.services[action.service].actions[actionKey];
      for (parameter in actionSchema.parameters) {
        var type = actionSchema.parameters[parameter].type;
        var paramObject = {name: parameter, class: type}
        codeParams.parameters.push(paramObject);
        if (type.indexOf('Kaltura') === 0) paramObject.fields = [];
        var cls = Schema.classes[type];
        for (field in cls.properties) {
          if (req.body.answers[field] !== undefined) {
            var fieldType = cls.properties[field].type;
            paramObject.fields.push({
                name: field,
                type: fieldType,
                value: '<%- Lucy.code.variable("answers.' + field + '") %>'
            })
          }
        }
      }
      for (key in req.body.answers) {
        
        if (actionSchema.parameters[key]) {
          
        } 
      }
      var rendered = EJS.render(CodeTemplates.actions[language], codeParams);
      buildParams.actions[action.action] = {};
      buildParams.actions[action.action][language] = rendered;
    });
    buildParams.actions.setup = {};
    buildParams.actions.setup[language] = CodeTemplates.setups[language];
    var ltmlViews = views.map(function(view) {return CodeTemplates.views[view]});
    Async.map(
      ltmlViews,
      CodeBuilders.View.translateToEJS,
      function(err, ejsTemplates) {
        if (err) return res.status(500).send('Error translating LTML to EJS');
        views.forEach(function(view, index) {
          buildParams.views[view] = {html: ejsTemplates[index]};
        });
        CodeBuilders.Recipe.build(buildParams, callback);
      }
    );
  });
};

Router.get('/:recipe/embed', function(req, res) {
  req.body = req.body || {};
  req.body.language = 'javascript';
  req.body.answers = {};
  for (key in req.query) {
    req.body.answers[key] = JSON.parse(req.query[key]);
  }
  buildRecipe(req, res, function(err, files) {
    if (err) return res.status(500).send('Error building recipe');
    else res.send(files[0].contents);
  })
});
