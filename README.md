
documentron.js v0.500
============

*A library for documenting libraries loosely based off of JSDOC.. Export methods to JSON, MD, and HTML. Yes it even exported this README!  See [http://documentronjs.chris-malcolm.com](http://documentronjs.chris-malcolm.com) for more info*

  ** *Menu* **  

 
- **Syntax** 
  - [About The Syntax](#documentation/About_The_Syntax) 
- **Attributes** 
  - [@Constructor](#documentation/@Constructor) 
  - [@property](#documentation/@property) 
  - [@info](#documentation/@info) 
  - [@group](#documentation/@group) 
  - [@param](#documentation/@param) 
  - [@returns](#documentation/@returns) 
  - [@example](#documentation/@example) 

- **Special Blocks** 
  - [@META](#documentation/@META) 
  - [@SHARED](#documentation/@SHARED) 

- **Methods** 
  - [Adding Library](#documentation/Adding_Library) 
- **Constructor** 
  - [Documentron()](#documentation/Documentron)  *Constructor* 

- **Exporters** 
  - [doc.toObject()](#documentation/doc.toObject) 
  - [doc.generateMenu()](#documentation/doc.generateMenu) 
  - [doc.generateHTML()](#documentation/doc.generateHTML) 
  - [doc.generateMD()](#documentation/doc.generateMD) 
  - [doc.toDataURIAnchorLink()](#documentation/doc.toDataURIAnchorLink) 

- **Helpers** 
  - [doc.getExampleById()](#documentation/doc.getExampleById) 
  - [doc.getGroup()](#documentation/doc.getGroup) 

- **Other Info** 
  - [Escaping Chars](#documentation/Escaping_Chars) 
  - [Data Structure](#documentation/Data_Structure) 
  - [Spaces in Names](#documentation/Spaces_in_Names) 
  - [Filtering Objects](#documentation/Filtering_Objects) 
  - [Group Sorting](#documentation/Group_Sorting) 

- **Templating** 
  - [Default Templates](#documentation/Default_Templates) 
  - [About Templating](#documentation/About_Templating) 

 

 #### &gt;&gt; Syntax 

<a id='documentation/About_The_Syntax' name='documentation/About_The_Syntax'></a>
About The Syntax
-----
---

  

Documentron parses scripts and looks for comment blocks, with the open portion having double \*\* asterisks. A doc item has 3 parts: a name, description, and a series of commands we call attribues. Coincidentally, they are defined by @+'CommandName'.  This syntax is based on the JSDoc syntax. Some improvements were creating more flexible framework for subparameters, flags, and groups. Preceding Asterisks in front of commands are optional and will be ignored. See [Data_Structure](#documentation/Data_Structure) for how it translates.<br/><br/>        /\*\* myFunction<br/><br/>            &lt;-- my description here --><br/><br/>            \*\*\* comments<br/>            @attribute1<br/>            @attribute2<br/>            @...<br/><br/>        \*/

*Example 1: Typical doc object syntax*
```false
/** addNumbers

  This function adds two numbers (A+B) together.

   *** comments are done with three asterisks
   @group helpers
   @param A {number} [default: 1, sample: 2] - First number to add
   @param B {number} [default: 0] - Second number to add

   @returns {number} - Resulting total number

*/

function addNumbers(a,b){
    return a+b
}
 ```

 #### &gt;&gt; Attributes 

<a id='documentation/@Constructor' name='documentation/@Constructor'></a>
@Constructor
-----
---

  

This flags the function as a constructor.

*Example 1: @Constructor (js)*
```js
/** MyClass

@Constructor

*/
var MyClass = function(opts){...}
 ```

<a id='documentation/@property' name='documentation/@property'></a>
@property
-----
---

  

Each doc object can either be a function (the default), [@property](#documentation/@property) , or [@info](#documentation/@info) type item. This flags this doc object as a property, rather than the default method/function. It follows the following format:<br/><br/>        @property &lt;type&gt;

*Example 1: @property string (js)*
```js
/** myProperty

@property String

*/
this.myProperty = "hello"
 ```

<a id='documentation/@info' name='documentation/@info'></a>
@info
-----
---

  

Each doc object can either be a function (the default), [@property](#documentation/@property) , or [@info](#documentation/@info) type item. Sometimes in our documentation we just have plain old information to expel that is not necessarily part of the source code as a function or property. This flags this doc object as an informative type, rather than the default method/function or a property. Using underscore for the naming of this type will automatically be converted to spaces in the menu and html exporters. [@example](#documentation/@example) and #group can be used on these as well!

*Example 1: @info (js)*
```js
/** Here_is_some_info

@info 

*/
 ```

<a id='documentation/@group' name='documentation/@group'></a>
@group
-----
---

  

Similar functions/properties/etc can be grouped for better organization by specifying a groupName.  When exporting to html/md/JSON/etc, groups allow one to sort and filter the data structure. See [Group_Sorting](#documentation/Group_Sorting) and [Filtering_Objects](#documentation/Filtering_Objects) for more info on how groups might be used. Subgroups can indefinitely be used (following dot notation)<br/><br/>@group &lt;groupName&gt;<br/>@group &lt;groupName.SubGroupName&gt;<br/>@group &lt;groupName.SubGroupName.SubSub..&gt;

*Example 1: @group simple use case (js)*
```js
/** myPrivateFunction

@group private

*/
function myPrivateFunction(){...}
 ```

*Example 2: @using subgroups (js)*
```js
/** generateHTML

@group Methods.Exporters

*/
function generateHTML(){...}
 ```

<a id='documentation/@param' name='documentation/@param'></a>
@param
-----
---

  

The @param is the argument in a function. For instance, there are three in the following: functionName(param1, param2, param3). Very frequently, you may have multiple parameters, and can use the [@param](#documentation/@param) attribute multiple times as needed. There are two special zones. Curly braces {} are used to describe the type of the value. Flags are comma delimited key:value pairs within brackets []. Both of these [flags] and {type} zones can precede or come after the param/subparam name.<br/><br/>syntax is typically:<br/>@param {type} [flags] name - title<br/><br/>Subparameters are also available, aka parameters of a parameter. a use case would be if you receive  options as a single parameter and want to describe the individual key values (subparams). this is done on a per line basis with a --> instead of hyphen.<br/><br/>@param {type} [flags] name - title<br/>        {type} [flags] key1 --> value1<br/>        {type} [flags] key2 --> value2<br/>        {type} [flags] key3 --> value3<br/><br/>Certain flags are included and used by default, of course custom flags can be added.<br/>    "optional" - this parameter is optional<br/>    "sample" - this is a sample value for this parameter . an example of what can be used<br/>    "default" - this is the default value if none is given.

*Example 1: @param simple example (js)*
```js
/** add(A,B)

@param A {number} [default: 1, sample: 3] - First Number to add
@param B {number} [default: 1, sample: 2] - Second Number to add

*/

function add(a,b){return a+b}
 ```

*Example 2: @param options using subparameters (js)*
```js
/** setPerson

@param {Object} [optional] - an object describing a person
  name {string} [default: Nobody, sample: Steve] --> Persons name
  age {int} [default: 1, sample: 18] --> Age in years
  height {string} [default: 6'0", sample 4'0"] --> Persons height (feet inches)

*/
function setPerson(opts){
    var defaultOpts = {
        name: "Nobody",
        age: 1,
        height: "6'0\""
    }
}
 ```

<a id='documentation/@returns' name='documentation/@returns'></a>
@returns
-----
---

  

What this functions returns. Curly braces {} are used to describe the type of the value, similar to [@param](#documentation/@param) . Return also can have subparameters, similar to [@param](#documentation/@param) .. a use case would be if you're returning an object and want to describe the individual key values].<br/><br/>@returns {&lt;type&gt;} &lt;description&gt;

*Example 1: @returns simple example (js)*
```js
/** helloWorld

@returns {string}  Returns "hello world!"

*/
function hellowWorld(){ return "hello world"}
 ```

*Example 2: @return an object with subparameters (js)*
```js
/** getPerson

@returns {Object} Returns an object describing a person
  name {string} --> Persons name
  age {int} [default: 1, sample: 18] --> Age in years
  height {string} --> Persons height (feet inches)

*/
function getPerson(){ return {
  name: "bob", 
  age: 25, 
  height: "5'11\""
}}
 ```

<a id='documentation/@example' name='documentation/@example'></a>
@example
-----
---

  

Examples are code snippets to illustrate an example. You can have as many examples as you would like per property/function/info doc object. Certain flags (in brackets [] ) are specified to tell the programming language (if using prettyprint, this should match their convention i.e. html for HTML and js for javascript, etc..) and a unique id (title) of the example. The lang flag helps for pretty printing later, if enabled.<br/><br/>Flags<br/>    - id: A unique description for this coding example<br/>    - lang: Programming language (ex. js for javascript)<br/><br/><br/>@example [id: &lt;example descriptor&gt;, lang: &lt;programming Language&gt; ]<br/>&lt;my multiline code snippet&gt;

*Example 1: a typical @example (js)*
```js
/** addNumbers

@example [id: Add two numbers, lang: js]

 var total = addNumbers(3,4) //total: 7
*/

function addNumbers(a,b){
    return a+b
}
 ```

 

 #### &gt;&gt; Special Blocks 

<a id='documentation/@META' name='documentation/@META'></a>
@META
-----
---

  

Meta data is data that you can specify that doesn't necessarily relate to a specific variable,info, or method in your script. This might be info important for you, but not necessarilly visible for the public. The intention is to be able to use it in your own way when exported to Object and make it visible only if you desire. See [Data_Structure](#documentation/Data_Structure) to see where meta info is stored.<br/><br/>     It can be multiple lines and be plain text or written to be  multiple sub parameters (similar to #@param) via the following subpart syntax:  subkey[flagName:flagValue] --> This is the subkey Description

*Example 1: entering meta data (js)*
```js
/** @META
@key1 value
@key2 value with
multiple lines
@key3 subkeyA [flagName:flagValue, flagName2:flagValue2] --> sub-descrip
 subkeyB [flagName:flagValue, flagName2:flagValue2] --> sub-descrip
*/
 ```

*Example 2: resulting object (js)*
```js
//This will convert to  the following
doc.meta = {
    key1: {
        subparams: {}, 
        description: "value"
    },
    key2: 
        subparams: {}, 
        description: "value with \nmultiple lines"
    },
    key3: {
        subparams: {
            subKeyA: {
                subparams: {
                    flagName: "flagValue",
                    flagName2: "flagValue2"
                }
            },
            subKeyB: {
                subparams: {
                    flagName: "flagValue",
                    flagName2: "flagValue2"
                }
            }
        }
    }
}
 ```

<a id='documentation/@SHARED' name='documentation/@SHARED'></a>
@SHARED
-----
---

  

Shared data can be used inside [@returns](#documentation/@returns) and [@param](#documentation/@param) 's descriptions, across multiple function/properties where inputs/outputs might be repeated. It follows the same format as the [@META](#documentation/@META) block . If you have subparams / descriptions that should be shared for these sorts of types, you can specify the shared data in a [@SHARED](#documentation/@SHARED) block like in example 1 below.<br/><br/>    Example 1: Define a shared data item. (@mySharedData)<br/>    Example 2: Then in your function you can access this by placing double @ symbol in front of the desired key, basically  @@[SHARED_KEYNAME] in a parameter or returns description.<br/>    Example 3: The resulting merged doc item. What will happen is it will basically replace the @@.. with the shared data description  as well as copy over any subparams found.

*Example 1: entering shared data (js)*
```js
/** @SHARED
    @mySharedData - and here is a description to be shared
        sharedKey1 --> Im subparam value #1
        sharedKey2 --> Im subparam value #2
*/
 ```

*Example 2: link data inside param description (js)*
```js
/** mySpecialFunction
    @param myParam - this is my param description, @@mySharedData
*/
 ```

*Example 3: Final merged "mySpecialFunction()" (js)*
```js
/** mySpecialFunction
@param myParam - this is my param description, and here is a description to be shared
    sharedKey1 --> Im subparam value #1
    sharedKey2 --> Im subparam value #2
*/
 ```

 

 

 #### &gt;&gt; Methods 

<a id='documentation/Adding_Library' name='documentation/Adding_Library'></a>
Adding Library
-----
---

  

Before starting make sure you have included <a target='_blank' href='http://jquery.com'>jQuery </a> and the documentron.js library in the head of your script

*Example 1: Include Script (html)*
```html
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Demo</title>
       <script src="js/jquery.js"></script>
       <script src="js/documentron.js"></script>
</head>
<body>
</body>
</html>
 ```

 #### &gt;&gt; Constructor 

<a id='documentation/Documentron' name='documentation/Documentron'></a>
Documentron()
-----
---

 *Constructor*   
 
#### Returns: *[Documentron](#documentation/Documentron) Object* 

```
Documentron()
```

Constructor for creating a new documentron object. Src can be provided one of three ways: srcObj, url, srcTxt. See options below.

+ **opts** *object* *(optional)* - Init Options  
  + **url** *string*  - Provide a url to a script to parse (using ajax). See srcTxt or srcObj for other methods of providing source code / initial data. 
  + **srcTxt** *string*  - Provide source as text to parse. See url or srcObj for other methods of providing source code / initial data. 
  + **srcObj** *object*  - Provide a json object (not really parsing anything) to load in. See url or srcTxt for other methods of providing source code / initial data. 
  + **templateEngine** *function*  - Template engine for exporter (HTML/MD/..) functions, see [About_Templating](#documentation/About_Templating) for more info. ...  *Default:* **function(tmpl, obj, _self){return _self.simpleTmplParser}**
  + **onSuccess** *function*  - callback for when source code has been successfully parsed. ...  *Default:* **function(doc,_self){}**
  + **onError** *function*  - callback for when Source Code parsing has failed for some reason. ...  *Default:* **function(error){}**

**Return --&gt;** *[Documentron](#documentation/Documentron) Object* - Documentron instance

*Example 1: Create a documentron instance via ajax (js)*
```js
//create a new instance
var doc =  new Documentron({
    url: "js/myAmazingLibrary.js",
    onSuccess: function(data,_self){
        console.log("success",data)

        //generate your html page
        var html = doc.generateHTML()

        //..or get an object
        var docObj = doc.toObject()
        
    },
    onError: function(error){
        console.log("An Error Occurred: ", error)
    })
 ```

*Example 2: Create a documentron instance via text (js)*
```js
//create a new instance
var doc =  new Documentron({
    srcTxt: "[YOUR SOURCE HERE]",
    onSuccess: function(data,_self){},
    onError: function(error){
        console.log("An Error Occurred: ", error)
    })

//generate your html page
var html = doc.generateHTML()
 ```

 

 #### &gt;&gt; Exporters 

<a id='documentation/doc.toObject' name='documentation/doc.toObject'></a>
doc.toObject()
-----
---

  
 
#### Returns: *Object* 

```
doc.toObject()
```

Grabs doc data as json object based on some options

+ **opts** *object* *(optional)* - Options for exporting.    
  + **sortByGroup** *bool*  - Sort by group..instead of all as one command list @group command. See [Group_Sorting](#documentation/Group_Sorting) for more information on how this affects the data structure. ...  *Default:* **false**
  + **filter** *Object*  - a filter object..see [Filtering_Objects](#documentation/Filtering_Objects) for more info on the filtering object ...  *Default:* **{}**
  + **linkFormat** *string|bool*  - if this is true functions/properties with #, ex. #functionName will be converted to  &lt;a href=''&gt; html links to navigate documentation.  You can also supply your own string template to be used, where {{LINK}} is the functionName. ...  *Default:* **true aka "&lt;a href='#{{LINK}} '&gt; {{LINK}} &lt;/a&gt;"**
  + **externalLinkFormat** *string|bool*  - Similar to linkformat (used for local anchor links), this converts external links. The syntax is like so: [ex. Site (http://site.com)], where {{LINK}} would be http://site.com and {{NAME}} would be "ex. Site" ...  *Default:* **true aka "&lt;a target='_blank' href='#{{LINK}} '&gt; {{NAME}} &lt;/a&gt;"**
  + **excludeMeta** *bool*  - If set true, meta will not be exported with the normal doc data. ...  *Default:* **false**

**Return --&gt;** *Object* - Object Representing documentation data, i.e. {doc: {}, meta: {}}

*Example 1: Export to doc object (js)*
```js
//lets get a JS Object, we'll ignore items in the 'private' group
var docObj = doc.toObject({
    sortByGroup: true, //organized by groups
    filter: {groupIgnore: "private"} //ignore  private functions
})
 ```

<a id='documentation/doc.generateMenu' name='documentation/doc.generateMenu'></a>
doc.generateMenu()
-----
---

  
 
#### Returns: *string* 

```
doc.generateMenu()
```

Generate HTML Menu based on documentation object

+ **opts** *object* *(optional)* - Options for exporting.    
  + **sortByGroup** *bool*  - Sort by group..instead of all as one command list @group command. See [Group_Sorting](#documentation/Group_Sorting) for more information on how this affects the data structure. ...  *Default:* **false**
  + **filter** *Object*  - a filter object..see [Filtering_Objects](#documentation/Filtering_Objects) for more info on the filtering object ...  *Default:* **{}**
  + **template** *string|bool*  - template to be used.  If set to false, the default built-in template (see [Default_Templates](#documentation/Default_Templates) ) will be used. See [About_Templating](#documentation/About_Templating) for more info. ...  *Default:* **false**
  + **el** *string*  - element to populate with the compiled template. By default this is false ... *e.g: * *#myDiv* *Default:* **false**
  + **anchorUrl** *string*  - Template for url (# + LINK, hash excluded from template). This applies to links (in menu) and anchors (in html and MD) specifically. Edit this if your anchors have a prefix or special formatting. You can also supply your own string template to be used, where {{LINK}} is the functionName. ... *e.g: * *"subhash/{{LINK}}"* *Default:* **"{{LINK}}"**

**Return --&gt;** *string* - Generated HTML Menu as a string.

*Example 1: generate html menu (js)*
```js
//lets make a menu, broken down by groups, and ignore private groups
var menu = doc.generateMenu({
    sortByGroup: true, //menu organized by groups
    filter: {groupIgnore: "private"}, //ignore  private functions
    el: "#myMenuEl" //selector to populate 
})
 ```

<a id='documentation/doc.generateHTML' name='documentation/doc.generateHTML'></a>
doc.generateHTML()
-----
---

  
 
#### Returns: *string* 

```
doc.generateHTML()
```

Generate HTML based on documentation object

+ **opts** *object* *(optional)* - Options for exporting.     
  + **sortByGroup** *bool*  - Sort by group..instead of all as one command list @group command. See [Group_Sorting](#documentation/Group_Sorting) for more information on how this affects the data structure. ...  *Default:* **false**
  + **filter** *Object*  - a filter object..see [Filtering_Objects](#documentation/Filtering_Objects) for more info on the filtering object ...  *Default:* **{}**
  + **template** *string|bool*  - template to be used.  If set to false, the default built-in template (see [Default_Templates](#documentation/Default_Templates) ) will be used. See [About_Templating](#documentation/About_Templating) for more info. ...  *Default:* **false**
  + **el** *string*  - element to populate with the compiled template. By default this is false ... *e.g: * *#myDiv* *Default:* **false**
  + **anchorUrl** *string*  - Template for url (# + LINK, hash excluded from template). This applies to links (in menu) and anchors (in html and MD) specifically. Edit this if your anchors have a prefix or special formatting. You can also supply your own string template to be used, where {{LINK}} is the functionName. ... *e.g: * *"subhash/{{LINK}}"* *Default:* **"{{LINK}}"**
  + **linkFormat** *string|bool*  - if this is true functions/properties with #, ex. #functionName will be converted to  &lt;a href=''&gt; html links to navigate documentation.  You can also supply your own string template to be used, where {{LINK}} is the functionName. ...  *Default:* **true aka "&lt;a href='#{{LINK}} '&gt; {{LINK}} &lt;/a&gt;"**
  + **externalLinkFormat** *string|bool*  - Similar to linkformat (used for local anchor links), this converts external links. The syntax is like so: [ex. Site (http://site.com)], where {{LINK}} would be http://site.com and {{NAME}} would be "ex. Site" ...  *Default:* **true aka "&lt;a target='_blank' href='#{{LINK}} '&gt; {{NAME}} &lt;/a&gt;"**
  + **lineBreaksToBreakTags** *bool*  - If true, Line breaks (\\n) in the description area will be automatically converted into break html tags. ...  *Default:* **true**
  + **prettyprint** *bool*  - Pretty printing for code examples. By default this is false. If set to true, make sure you have <a target='_blank' href='https://cdnjs.cloudflare.com/ajax/libs/prettify/r298/prettify.js'>prettify.js </a>   as a dependency and for stylizing use the necessary css. ...  *Default:* **false**

**Return --&gt;** *string* - Generated HTML as a string.

*Example 1: generate html documentation (js)*
```js
//lets make documentation, broken down by groups, and ignore private groups
var docHTML = doc.generateMenu({
    sortByGroup: true, //organized by groups
    filter: {groupIgnore: "private"}, //ignore  private functions
    el: "#myDiv" //selector to populate 
})
 ```

<a id='documentation/doc.generateMD' name='documentation/doc.generateMD'></a>
doc.generateMD()
-----
---

  
 
#### Returns: *string* 

```
doc.generateMD()
```

Generate Markdown based on documentation object

+ **opts** *object* *(optional)* - Options for exporting.    
  + **sortByGroup** *bool*  - Sort by group..instead of all as one command list @group command. See [Group_Sorting](#documentation/Group_Sorting) for more information on how this affects the data structure. ...  *Default:* **false**
  + **filter** *Object*  - a filter object..see [Filtering_Objects](#documentation/Filtering_Objects) for more info on the filtering object ...  *Default:* **{}**
  + **template** *string|bool*  - template to be used.  If set to false, the default built-in template (see [Default_Templates](#documentation/Default_Templates) ) will be used. See [About_Templating](#documentation/About_Templating) for more info. ...  *Default:* **false**
  + **el** *string*  - element to populate with the compiled template. By default this is false ... *e.g: * *#myDiv* *Default:* **false**
  + **anchorUrl** *string*  - Template for url (# + LINK, hash excluded from template). This applies to links (in menu) and anchors (in html and MD) specifically. Edit this if your anchors have a prefix or special formatting. You can also supply your own string template to be used, where {{LINK}} is the functionName. ... *e.g: * *"subhash/{{LINK}}"* *Default:* **"{{LINK}}"**
  + **linkFormat** *string|bool*  - if this is true functions/properties with #, ex. #functionNames will be converted to [{{LINK}}] (#{{LINK}}) markdown links to navigate documentation. You can also supply your own string template to be used, where {{LINK}} is the functionName. ...  *Default:* **true aka [{{LINK}}] (#{{LINK}})**
  + **externalLinkFormat** *string|bool*  - Similar to linkformat (used for local anchor links), this converts external links. The syntax is like so: [ex. Site (http://site.com)], where {{LINK}} would be http://site.com and {{NAME}} would be "ex. Site" ...  *Default:* **true aka [{{NAME}}] ({{LINK}})**
  + **libTitle** *string* *(optional)* - A title of library to populate at the top of predefined template where {{libTitle}} would be placeholder. ...  *Default:* **"myLib.js"**
  + **libDescription** *string* *(optional)* - A description of library to populate at the top of predefined template where {{libDescription}} would be placeholder. ...  *Default:* **"A library for.."**

**Return --&gt;** *string* - Generated Markdown syntax as a string.

*Example 1: generate Markdown documentation (js)*
```js
//lets make MD documentation, broken down by groups, and ignore private groups
var docMD = doc.generateMD({
    sortByGroup: true, //organized by groups
    filter: {groupIgnore: "private"} //ignore  private functions
})
 ```

<a id='documentation/doc.toDataURIAnchorLink' name='documentation/doc.toDataURIAnchorLink'></a>
doc.toDataURIAnchorLink()
-----
---

  
 
#### Returns: *string* 

```
doc.toDataURIAnchorLink()
```

General Anchor http link for downloading, used after one has already generated text.

+ **opts** *object* *(optional)* - Options for link  
  + **fileName** *string*  - desired filename (for when downloaded) ...  *Default:* **"download.txt"**
  + **content** *string|object*  - text to encode as a data URI. If object is given, it will be JSON encoded. 
  + **indent** *int*  - if opts.content is an object, this controls the indent factor for when the object is json encoded. ...  *Default:* **3**

**Return --&gt;** *string* - HTML Anchor HREF link as string

*Example 1: generate download link for html (js)*
```js
//<a href='data:text/plain;base64,..' download='myDoc.html'>myDoc.html</a>

var link = doc.toDataURIAnchorLink({
        fileName: "myDoc.html", 
        content: doc.generateHTML(),
})
 ```

 

 #### &gt;&gt; Helpers 

<a id='documentation/doc.getExampleById' name='documentation/doc.getExampleById'></a>
doc.getExampleById()
-----
---

  
 
#### Returns: *object* 

```
doc.getExampleById()
```

Need to get an example ? Sometimes maybe you need to make a "getting started" and want to use the same snippet of code elsewhere on your page. This is a great way to query your docs.<br/><br/>    Params:

+ **id** *string*  - Id of example to find  

**Return --&gt;** *object* - The example object

  + **id** *string*  - id of object 
  + **lang** *string*  - programming language 
  + **code** *string*  - code snippet 

*Example 1: querying for an example (js)*
```js
var myExampleObj = docs.getExampleById("Using the addNumbers() function")
 ```

<a id='documentation/doc.getGroup' name='documentation/doc.getGroup'></a>
doc.getGroup()
-----
---

  
 
#### Returns: *object* 

```
doc.getGroup()
```

Grab a group by its name<br/><br/>    Params:

+ **groupName** *string*  - name of group  

**Return --&gt;** *object* - The group in object form

*Example 1: grabbing the "specialFunctions" group (js)*
```js
//myGroup = {func1: {..}, func2: {..}, func3: {..}}
var myGroup = docs.getGroup("specialFunctions")
 ```

 

 

 #### &gt;&gt; Other Info 

<a id='documentation/Escaping_Chars' name='documentation/Escaping_Chars'></a>
Escaping Chars
-----
---

  

With this kind of text parsing you probably will run into a few times where you want to have the literal characters ex. @ or and asterisk \*. Below are what you need to type to achieve this.

*Example 1: Examples of escaped chars (js)*
```js
/*

Desired symbol                  Type
------------------------        ----
Asterisk            (*)        \* 
At symbol           (@)        \@
Forward Slash       (/)        \/
Commas in flag zone ( ,)        \,
Colon in flag zone  ( :)        \:
Hyphen              ( -)        \-

*/
 ```

<a id='documentation/Data_Structure' name='documentation/Data_Structure'></a>
Data Structure
-----
---

  

A small glimpse into what the data structure looks like (if exported as JSON or the js object template'd as MD/HTML). This may slightly change if [Group_Sorting](#documentation/Group_Sorting) is enabled. Here we document a really silly addNumbers function.

*Example 1: block for addNumbers (js)*
```js
/** addNumbers

This add two numbers together, with (very aribitrary) options as well

@param A {int}[sample: 2] - First number
@param B {int} [sample: 3,optional, default: 1]- Second number
@param options {Object} [optional] - Series of options
    multiplier {number} [sample: 2] --> multiplier for each number before adding
    suffix {string} [sample: " inches"] --> suffix to add to end to number
    minusInstead {bool} [default: false] --> do subtraction instead

@returns {number|string} Resulting number

@example [id: adding a number, lang: js]

//add (4*3)+(7*3)
addNumbers(4,7,{multiplier: 3})

*/

function addNumbers(A,B,opts){..}
 ```

*Example 2: resulting object for add numbers (js)*
```js
{
    "meta": {..}, //if meta provided
    "doc":{ "addNumbers": {
        "isDocObject":true, //true for property, info, or function (nongroups)
        "name":"addNumbers",
        "description":"This add two numbers together, w..",
        "param":[{ //param array
            "description":"First number",
            "type":"int",
            "sample":"2",
            "flags":{}, //custom flags go here
            "name":"A"
            },{
            "description":"Second number",
            "type":"int",
            "sample":"3",
            "optional":true,
            "flags":{}, //custom flags go here
            "default":"1",
            "name":"B"
            },{
            "description":"Series of options",
            "type":"Object",
            "optional":true,
            "flags":{}, //custom flags go here
            "subparams": //subparameters
                {"multiplier": {
                    "description":"multiplier for each number before adding",
                    "type":"number",
                    "sample":"2",
                    "flags":{}, //custom flags would show up here
                    "name":"multiplier"
                },
                "suffix":{
                    "description":"suffix to add to end to number",
                    "type":"string",
                    "sample":"\" inches\"",
                    "flags":{},
                    "name":"suffix"
                },
                "minusInstead":{
                    "description":"do subtraction instead",
                    "type":"bool",
                    "default":"false",
                    "flags":{},
                    "name":"minusInstead"
                }
            },
            "name":"options"
        }],
        "returns": { //what object returns
            "description": "Resulting number",
            "type": "number|string"
        },
        "example":[{ //example array
            "id":"adding a number",
            "lang":"js",
            "flags":{}, //custom flags would show up here
            "code":"\n\n//add (4*3)+(7*3)\naddNumbers(4,7,{multiplier: 3})"
        }],
        "paramNamesArr":["A","[,B]","[,options]"], //array of formatted function params
        "function":true //this would exist if it is a function (not property or info)
    }
}
 ```

<a id='documentation/Spaces_in_Names' name='documentation/Spaces_in_Names'></a>
Spaces in Names
-----
---

  

Functions and properties always have will never have spaces in their names, when you define the block. but what about plain info ( [@info](#documentation/@info) ) in the documentation? And what about group names ( [@group](#documentation/@group) )?  For both of these types, we convert underscores (_) to spaces ( ), so your doc looks nice and clean! So just use underscores, and don't worry about it! For links (#links) you still want to use the underscore though.

*Example 1: Spaces in group and info name (js)*
```js
/** Super_important_information

 here is some informartion

@info
@group im_a_group_with_spaces

*/
 ```

<a id='documentation/Filtering_Objects' name='documentation/Filtering_Objects'></a>
Filtering Objects
-----
---

  

Used in almost every single export method is the filter option. Filtering is done by feeding a 'literal object', dubbed a "filter object", where a user can supply a number of desired key value pairs. The key is the filter type, and the value is comma separated list..see example for the available types.

*Example 1: A filter object (js)*
```js
{
   groupOnly: "helpers.*,helpers" //only allow these groups, * is wildcard for subgroups
   groupIgnore: "helpers.*", // ignore these groups
   only: "getAvailableModels" //only grab these
   ignore: "anotherProperty, getAvailableModels" //ignore these 
}
 ```

<a id='documentation/Group_Sorting' name='documentation/Group_Sorting'></a>
Group Sorting
-----
---

  

sortByGroup, a common export option,  is an option that if set true, sorts the object (and html/md representation) by the group attribute. By default this is set to false.

*Example 1: How grouping works (js)*
```js
// NOTE: this is a purely conceptual pseudo-code to 
// demonstrate the principal, not actual JS code.

//if you imagine these  documented functions to have the following group attributes
{
    function1 : "@group _private"
    function2 : "@group helpers"
    function3 : "@group helpers"
    function4 : "@group helpers.core" //note the dot syntax for subgroups
}

//sortByGroup: true in the #toObject routine, would result in a Object similar syntax to
{
    _private : [
        "function1"
    ],
    helpers: [
        "function2",
        "function3",
        core: [
            "function4"
        ]
    ]

}
 ```

 

 #### &gt;&gt; Templating 

<a id='documentation/Default_Templates' name='documentation/Default_Templates'></a>
Default Templates
-----
---

  

We use default templates for html,menu, and markdown exporters. Wanna see what they look like, maybe slightly tweak them to your own liking? Go for it by clicking the links to them below!<br/><br/>        HTML: [html-template]<br/>        Menu (HTML): [html-menu-template]<br/>        Markdown: [markdown-template]

<a id='documentation/About_Templating' name='documentation/About_Templating'></a>
About Templating
-----
---

  

A Template engine is used for easily laying out the doc data into  html, md, etc. By default, Documentron uses its own built in parser (more info below). If desired, an alternative template engine such as <a target='_blank' href='http://handlebarsjs.com/'>Handlebars.js</a> may be specified in the options. <br/><br/>        Keep in mind, that if you use a custom engine, you likely will need to supply  your own template string as well for each html/md/etc generator:

*Example 1: Changing the template engine (js)*
```js
//in the constructor options, change the templatengine option. This is the default

var doc = new Documentron({
    templateEngine: function(tmpl, obj, _self){
        return _self.simpleTmplParser(tmpl,obj)
    }
})

//to use handlebars, you can do this instead 
//(just make sure you include Handlebars.js  as a dependency)

var doc = new Documentron({
    templateEngine: function(tmpl, obj, _self){
        var template = Handlebars.compile(tmpl);
        return template(obj)
    }

})
 ```

 