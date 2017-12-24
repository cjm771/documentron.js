 /*
 * documentron.js v0.500 
 * http://documentronjs.chris-malcolm.com
 *
 * Copyright 2017, Chris Malcolm
 * http://chris-malcolm.com/
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 *
 *  A library for documenting libraries
 *
 */

    /** @SHARED
        @coreObjectShared
            sortByGroup {bool} [default: false] --> Sort by group..instead of all as one command list @group command. See #Group_Sorting for more information on how this affects the data structure.
                filter {Object} [default: {}] --> a filter object..see #Filtering_Objects for more info on the filtering object
        @linkFormatShared
            linkFormat {string|bool} [default: true aka "&lt;a href='#{{LINK}} '&gt; {{LINK}} &lt;/a&gt;"] --> if this is true functions/properties with #, ex. #functionName will be converted to  &lt;a href=''&gt; html links to navigate documentation.  You can also supply your own string template to be used, where {{LINK}} is the functionName.
            externalLinkFormat {string|bool} [default: true aka "&lt;a target='_blank' href='#{{LINK}} '&gt; {{NAME}} &lt;/a&gt;"] --> Similar to linkformat (used for local anchor links), this converts external links. The syntax is like so: [ex. Site (http://site.com)], where {{LINK}} would be http://site.com and {{NAME}} would be "ex. Site"
        @exporterShared 
            template {string|bool} [default: false] --> template to be used.  If set to false, the default built-in template (see #Default_Templates ) will be used. See #About_Templating for more info.
            el {string} [default:false, sample: #myDiv] --> element to populate with the compiled template. By default this is false
            anchorUrl {string} [default: "{{LINK}}", sample: "subhash/{{LINK}}"]--> Template for url (# + LINK, hash excluded from template). This applies to links (in menu) and anchors (in html and MD) specifically. Edit this if your anchors have a prefix or special formatting. You can also supply your own string template to be used, where {{LINK}} is the functionName.
    */

    /** About_The_Syntax
        
        Documentron parses scripts and looks for comment blocks, with the open portion having double ** asterisks. A doc item has 3 parts: a name, description, and a series of commands we call attribues. Coincidentally, they are defined by @+'CommandName'.  This syntax is based on the JSDoc syntax. Some improvements were creating more flexible framework for subparameters, flags, and groups. Preceding Asterisks in front of commands are optional and will be ignored. See #Data_Structure for how it translates.

        /** myFunction

            <-- my description here -->

            \*** comments
            \@attribute1
            \@attribute2
            \@...

        \*\/

        @group Syntax
        @info

        @example [id: Typical doc object syntax, lang; js]

/** addNumbers

  This function adds two numbers (A+B) together.

   \*** comments are done with three asterisks
   \@group helpers
   \@param A {number} [default: 1, sample: 2] - First number to add
   \@param B {number} [default: 0] - Second number to add

   \@returns {number} - Resulting total number

\*\/

function addNumbers(a,b){
    return a+b
}
    */


    /** Adding_Library

    Before starting make sure you have included [jQuery (http://jquery.com)] and the documentron.js library in the head of your script

    @info   
    @group Methods
    @example [id: Include Script, lang: html]
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

*/

    /** Documentron
    
    Constructor for creating a new documentron object. Src can be provided one of three ways: srcObj, url, srcTxt. See options below.
    @Constructor
    @group Methods.Constructor
    @param opts {object} [optional] - Init Options
            url {string} --> Provide a url to a script to parse (using ajax). See srcTxt or srcObj for other methods of providing source code / initial data.
            srcTxt {string} -->  Provide source as text to parse. See url or srcObj for other methods of providing source code / initial data.
            srcObj  {object} --> Provide a json object (not really parsing anything) to load in. See url or srcTxt for other methods of providing source code / initial data.
            templateEngine {function} [default: function(tmpl\, obj\, _self){return _self.simpleTmplParser}] --> Template engine for exporter (HTML/MD/..) functions, see #About_Templating for more info.
            onSuccess {function} [default: function(doc\,_self){}] --> callback for when source code has been successfully parsed.  
            onError {function} [default: function(error){}] --> callback for when Source Code parsing has failed for some reason.  
            
            
    @returns {#Documentron Object} Documentron instance

    @example [id: Create a documentron instance via ajax,  lang: js ]

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


@example [id: Create a documentron instance via text,  lang: js ]

//create a new instance
var doc =  new Documentron({
    srcTxt: "[YOUR SOURCE HERE]",
    onSuccess: function(data,_self){},
    onError: function(error){
        console.log("An Error Occurred: ", error)
    })

//generate your html page
var html = doc.generateHTML()

    */

function Documentron(opts){
    var opts = opts || {}
    this.opts = $.extend({
        srcObj: undefined, //provide a json object (not really parsing anything)
        url: undefined, //provide a url to a script to parse (using ajax)
        srcTxt: undefined, //provide text string to parse (no ajax)
        templateEngine: function(tmpl, obj,_self){
            return _self.simpleTmplParser(tmpl,obj)
        },
        onSuccess : function(doc,_self){

        },
        onError: function(error){
            throw new Error("Error! "+error)
        }
    },opts)
    var that  = this
    this.attFlagsRegex  = /\[(.+)\]/
    this.doc = {}
    this.meta = {}
    this.shared = {}
    this.raw = ""
    this.srcType = "url"
    this.attTypeRegex = /\{(.+)\}/


    this.init = function(){
        this.determineSrcType()
        
    }   
    this.determineSrcType = function(){
        //receive src object
        if (this.opts.srcObj!=undefined && $.isPlainObject(this.opts.srcObj)){
            this.srcType = "srcObj"
            this.doc = this.opts.srcObj
            this.raw = JSON.stringify(this.opts.srcObj,null,3)
            this.opts.onSuccess(this.doc, this)
        //recv raw text
        }else if (this.opts.srcTxt!=undefined && typeof this.opts.srcTxt == "string"){
            this.srcType = "srcTxt"
            this.raw = this.opts.srcTxt
            this.parseJS(this.opts.srcTxt)
            this.opts.onSuccess(this.doc, this)
        }else if (this.opts.url!=undefined && typeof this.opts.url == "string"){ 
            this.doc = this.opts.url
            this.readJS(this.opts.url)
        }else{
            if (this.opts.srcObj!=undefined)
                this.opts.onError("Could not parse srcObj. Check that object.")
            else if (this.opts.srcTxt!=undefined)
                this.opts.onError("Could not parse srcTxt. Check that raw text.")
            else if (this.opts.url!=undefined)
                this.opts.onError("Problem with url. Check that url.")
            else if (this.opts.srcTxt==undefined &&
                    this.opts.srObj==undefined &&
                    this.opts.url==undefined )
            this.opts.onError("Could not find srcType: Use srcObj, srcTxt, or url as an option to pull data from.")
        }
    }
    this.safeTrim = function(v){

        return (typeof v == "string") ? v.trim() : v
    }
    this.removeCommentLines = function(text){
        var that = this
        return this.eachLine(text, function(line){
            if (that.safeTrim(line).startsWith("***"))
                return false;
            else
                return line
        })
    }

    this.sortByGroups = function(obj){
        var retObj = {
            _other_ : []
        }
        obj = obj || this.doc
        $.each(obj, function(k,v){
            if (v.group!=undefined && that.safeTrim(v.group)!=""){
                var tmpStr = ""
                $.each(v.group.split("."), function(k2,v2){
                    tmpStr+="."+v2
                    if (eval("retObj"+tmpStr)==undefined){
                        eval("retObj"+tmpStr+" = {}")
                    }
                })
                eval("retObj."+that.safeTrim(v.group)+"[k] = v")
            }else{
                retObj._other_.push(v)
            }
        })
        if (retObj._other_.length == 0){
            delete retObj._other_
        }
        return retObj
    }

    /** doc.toObject
    
    Grabs doc data as json object based on some options 

    @group Methods.Exporters
    @param opts {object} [optional] - Options for exporting. @@coreObjectShared @@linkFormatShared
            excludeMeta  {bool} [default: false] --> If set true, meta will not be exported with the normal doc data.

            
    @returns {Object} Object Representing documentation data, i.e. {doc: {}, meta: {}}

    @example [id: Export to doc object,  lang: js ]
//lets get a JS Object, we'll ignore items in the 'private' group
var docObj = doc.toObject({
    sortByGroup: true, //organized by groups
    filter: {groupIgnore: "private"} //ignore  private functions
})

    */

    //true worker bee
this.toObject = function(opts, obj){
        var obj = obj || this.doc
        var opts = opts || {}
        opts = $.extend(true,{
            sortByGroup: false,
            excludeMeta: false,
            filter: false,
            linkFormat: true,
            externalLinkFormat: true
        },opts)

        var ret = $.extend({},  {
                doc:obj,
                meta:this.meta
            })

        if (opts.excludeMeta){
            delete ret.meta
        }

        if (opts.filter){
           
            ret.doc = this.filter(opts.filter, ret.doc)

        }

        if (opts.sortByGroup!=false){
            ret.doc = this.sortByGroups(ret.doc)
        }

        if (opts.linkFormat){
            ret.doc = this.hashesToLinks(ret.doc, opts.linkFormat)
        }
        if (opts.externalLinkFormat){
            ret.doc = this.externalLinkify(ret.doc, opts.externalLinkFormat)
        }


    
        if (opts.excludeMeta){
            delete ret.meta
        }
    
        return ret

    }

    this.toDataURI = function(opts, obj){
        var obj = obj || this.doc
        var opts = opts || {}
        opts = $.extend({
            indent: 3
            },opts)

        var ret = this.toObject(opts, obj)
        return  this._dataURI(JSON.stringify(ret,null, opts.indent))
    }


    this._dataURI = function(txt){
        return  "data:text/plain;base64,"+encodeURIComponent(btoa(txt))
    }

    this.getByTags = function(tags){
        var tagsSplit = tags.split(",")
        var results = {}
        var funcTags
        $.each(tagsSplit, function(tagIndex, tagName){
            tagName = that.safeTrim(tagName)
        
            $.each(that.doc, function(funcIndex, funcObj){
                if (funcObj.tags){
                    funcTags = funcObj.tags.split(",")
                    $.each(funcTags, function(fti, ft){
                        if (that.safeTrim(ft)==that.safeTrim(tagName)){
                            if (results[funcIndex]==undefined)
                                results[funcIndex] = funcObj
                        }
                    })
                }
            })
            
        })
        return results
    }

    /** doc.getExampleById

    Need to get an example ? Sometimes maybe you need to make a "getting started" and want to use the same snippet of code elsewhere on your page. This is a great way to query your docs.

    Params:
    @group Methods.Helpers
    @param id {string} - Id of example to find
    @example [id: querying for an example, lang: js]

var myExampleObj = docs.getExampleById("Using the addNumbers() function")

    @returns {object} The example object
        id {string} --> id of object
        lang {string} --> programming language
        code {string} --> code snippet 
    
    
    */

    this.getExampleById = function(id){
        var result = false
        $.each(this.doc, function(k,v){
            if (v.example!=undefined){
                $.each(v.example, function(exId, exObj){
                    if (that.safeTrim(exObj.id)==that.safeTrim(id)){
                        result =  exObj
                    }
                })
            }
        })
        return result
    }

    /** doc.getGroup

   Grab a group by its name

    Params:
    @group Methods.Helpers
    @param groupName {string} - name of group
    @example [id: grabbing the "specialFunctions" group, lang: js]

//myGroup = {func1: {..}, func2: {..}, func3: {..}}
var myGroup = docs.getGroup("specialFunctions")

    @returns {object} The group in object form
     
    
    
    */

    this.getGroup = function(x){
        var groups = this.sortByGroups()
        if (eval("groups."+x)!=undefined)
            return eval("groups."+x)
        else
            return false

    }
    this._filters = {
        groupOnly: function(keys, func){
            if (func.group==undefined)
                return false
            var tmpRegex
            var resultSuccess = false
            $.each(keys.split(","), function(k,v){
                v = that.safeTrim(v)
                tmpRegex = new RegExp("^"+v.replace(/\./g, "\\.").replace(/\*/g, "(.+)")+"$")
                if (func.group.match(tmpRegex)){
                     resultSuccess = true
                }
            })
            return resultSuccess
        },
        groupIgnore: function(keys, func){
            if (func.group==undefined)
                return false
            var tmpRegex
            var resultSuccess = true
            $.each(keys.split(","), function(k,v){
                v = that.safeTrim(v)
                tmpRegex = new RegExp("^"+v.replace(/\./g, "\\.").replace(/\*/g, "(.+)")+"$")
                if (func.group.match(tmpRegex)){
                     resultSuccess = false
                }
            })
            return resultSuccess
        },
        only: function(keys, func){
            var keysSplit = keys.split(",")
            if (keys.indexOf(func.name)!=-1){
                return true
            }else{
                return false
            }
        },
        ignore: function(keys, func){
            var keysSplit = keys.split(",")
            if (keys.indexOf(func.name)!=-1)
                return false
            else
                return true
        }
    }
    this.filter = function(filterOpts, retObj){
        retObj = retObj || this.doc
        var results = $.extend(true,{}, retObj)
        $.each(this._filters, function(filtName,filtFunc){
            if (filterOpts[filtName]!=undefined){
                $.each(results, function(funcName,funcObj){
                    if (!filtFunc(filterOpts[filtName], funcObj)){
                        delete results[funcName]
                    }
                })
            }else{
            }
        })
        return results
    }




    
    /** doc.generateMenu
        
         Generate HTML Menu based on documentation object 

        @group Methods.Exporters
        @param opts {object} [optional] - Options for exporting. @@coreObjectShared @@exporterShared

@example [id: generate html menu, lang: js ]
//lets make a menu, broken down by groups, and ignore private groups
var menu = doc.generateMenu({
    sortByGroup: true, //menu organized by groups
    filter: {groupIgnore: "private"}, //ignore  private functions
    el: "#myMenuEl" //selector to populate 
})

        @returns {string} Generated HTML Menu as a string.
        */



    this.generateMenu = function(opts){
        if (opts.template == false){
            opts.template = undefined
        }
        opts = $.extend(true,{
            template: "{{#setPartial getNoUnderscoresIfInfo}}{{#if ~.info }}{{#replace ~.name,_, }}{{else}}{{~.name}}{{/if}}{{/setPartial}}\n\n\n       {{#setPartial menu}}\n      <ul>\n          {{#each ~ as elName, el }}\n                    {{#if el.isDocObject}}\n                        <li>\n                      <a href='#{{el.anchorLink}}'>{{#partial getNoUnderscoresIfInfo,el}}{{#if el.function}}(){{/if}}</a>     \n                      {{#if el.Constructor}}\n                            <i style='font-size: 0.6em'>Constructor</i>\n                       {{/if}}\n                       </li>\n                 {{else}}\n                  <li class='group-{{elName}}'>\n                     <h5>{{#replace elName,_, }}</h5>\n                      {{#partial menu, el}}\n                 </li>\n                 {{/if}}\n           {{/each}}\n     </ul>\n     {{/setPartial}}\n   \n      {{#partial menu, ~}}"
        }, opts)
        return this.generateHTML(opts)
    }




    /** doc.generateHTML
    
     Generate HTML based on documentation object 

    @group Methods.Exporters
    @param opts {object} [optional] - Options for exporting. @@coreObjectShared @@exporterShared @@linkFormatShared
            lineBreaksToBreakTags {bool} [default: true] --> If true, Line breaks (\n) in the description area will be automatically converted into break html tags.
            prettyprint {bool} [default: false] --> Pretty printing for code examples. By default this is false. If set to true, make sure you have [prettify.js (https://cdnjs.cloudflare.com/ajax/libs/prettify/r298/prettify.js)]   as a dependency and for stylizing use the necessary css.
            
    @returns {string} Generated HTML as a string.


@example [id: generate html documentation, lang: js ]
//lets make documentation, broken down by groups, and ignore private groups
var docHTML = doc.generateMenu({
    sortByGroup: true, //organized by groups
    filter: {groupIgnore: "private"}, //ignore  private functions
    el: "#myDiv" //selector to populate 
})
    */


    this.generateHTML = function(opts, obj){

        var tmpl = "<!-- param item -->\n   {{#setPartial param}}\n     <span class='param_nameType_wpr'>\n     <b class='param_name'>{{name}}</b> {{#if type}}\n           <i class='param_type'>({{type}})</i>\n      {{/if}} {{#if optional}}<i class='param_optional'>(optional)</i>{{/if}}\n   </span><span class='param_descriptionSamplings_wpr'><span class='param_description'> <span class='param_hyphen'>-</span>  {{description}}</span> <span class='param_samplings samplings' style='font-size:.8em; padding-left: .6em;'>{{#if sample || default}}<span class='param_samplings_ellipse'>...</span>{{#if sample}}<i>ex: </i> <b>{{sample}}</b>{{/if}}{{#if default}}<i> Default:</i> <b>{{default}}</b>{{/if}}{{/if}}</span></span> \n   {{/setPartial}}\n\n {{#setPartial getNoUnderscoresIfInfo}}{{#if ~.info }}{{#replace ~.name,_, }}{{else}}{{~.name}}{{/if}}{{/setPartial}}\n  <!-- function item -->\n    {{#setPartial functionItem}}\n  <div class='function-item'>\n       <a id='{{~.anchorLink}}' name='{{~.anchorLink}}'></a>\n         <div class='function-header'>\n             <!-- constructor -->\n              <h2>{{#partial getNoUnderscoresIfInfo, ~}}{{#if ~.function}}(){{/if}}\n                 {{#if ~.Constructor==true}}\n                       <i class='constructor' style='font-size:.5em;'>Constructor</i>\n                    {{/if}}\n                   {{#if ~.property &amp;&amp; ~.property!=true}}\n                        <i class='propertyType' style='font-size: .5em'>Property {{~.property}}</i>\n                   {{/if}}\n                   {{#if ~.returns}}\n                     <i class='returns' style='font-size:.5em;text-align:right; padding-left: .2em;display:inline-block;font-weight:normal'>Returns: <b>{{~.returns.type}}</b></i>\n                 {{/if}}\n               </h2>\n         </div>\n        \n\n        <!-- properties-->\n        {{#if ~.function}}\n            <p class='function-format'><u><i>{{~.name}}\n\n             ({{#each ~.param}}\n                    {{#if ($FIRST &amp;&amp; $LENGTH&gt;1)}}\n                      {{#if this.optional}}\n                         [{{this.name}},]\n                      {{else}}\n                          {{this.name}},\n                        {{/if}}\n                   {{elif $LAST}}\n                        {{#if this.optional}}\n                         [{{this.name}}]\n                       {{else}}\n                          {{this.name}}\n                     {{/if}}\n                   {{else}}\n                      {{#if this.optional}}\n                         [{{this.name}},]\n                      {{else}}\n                          {{this.name}},\n                        {{/if}}\n                   {{/if}}\n               {{/each}})</i></u>\n            </p>\n      {{/if}}\n       <p class='function-description'>{{~.description}}</p>\n     <p class='function-params'></p>\n       <!-- params-->\n        <ul>\n          <li style='list-style: none'>\n         {{#each el.param}}</li>\n               <!-- do param typical setup-->\n                <li>{{#partial param, this}}</li>\n             <!-- subparams-->\n             <li style='list-style: none'>\n                 {{#if this.subparams}}\n                        <ul class='subparams'>\n                            <li style='list-style: none'>\n                             {{#each this.subparams as subparamName,subparamObj}}</li>\n                                 <li>{{#partial param, subparamObj}}</li>\n                                  <li style='list-style: none'>\n                             {{/each}}\n                         </li>\n                     </ul>\n                 {{/if}}\n           {{/each}}\n         </li>\n     </ul>\n     <p>\n           \n      </p>\n      <!-- return -->\n       {{#if ~.returns}}\n         <p class='function-returns'>\n              <b>Returns </b>\n                <i>({{~.returns.type}})</i> \n              -{{~.returns.description}}\n                {{#if  ~.returns.subparams}}\n             </p><ul class='subparams'>\n                    {{#each ~.returns.subparams as subparamName,subparamObj}}\n                     <li>{{#partial param, subparamObj}}</li>\n                  {{/each}}\n             </ul>\n             {{/if}}\n           <p></p>\n       {{/if}}\n       <!-- examples -->\n     {{#each ~.example}}\n           <h5 class='example_header'>Example {{$INDEX+1}}: {{this.id}}</h5><code class='prettyprint lang-{{this.lang}}' style='white-space: pre-wrap'>{{#trim this.code}}</code>\n            <p></p>\n       {{/each}}\n </div>\n    {{/setPartial}}\n\n <!-- actual methods..sorted in groups -->\n <div class='functions-wpr'>\n       <!--RECURSVIE PARTIAL FOR GROUPS -->\n      {{#setPartial groups2}}\n           {{#log running groups2 with $~}}\n          {{#each ~ as elName,el}}\n              {{#if el.isDocObject}}\n                    {{#partial functionItem, el}}\n             {{else}}\n                  <h4 id='functionGroupHeader-{{elName}}' style='font-style: italic; text-transform: Capitalize'>{{#replace elName,_, }}</h4>\n                   <div class='functionGroup' id='functionGroup-{{elName}}'>\n                     {{#partial groups2, el}}\n                  </div>\n                {{/if}}\n           {{/each}}\n     {{/setPartial}}\n       <!-- RUN DAT -->\n      {{#partial groups2, ~}}\n   </div>"

        obj = obj || this.doc
        opts = opts || {}
        opts = $.extend(true,{
            prettyprint: false, //wheter to use pritty print
            el: false, //el to populate
            template: tmpl, //string custom template
            anchorUrl: "{{LINK}}",
            lineBreaksToBreakTags: true,
            libTitle: "myLib.js", //used in md
            libDescription: "A library for..", //used in md
            onLoad: function(el, data,meta){
                return false //do something on load
            }
        }, opts)

    

        var retObj = this.toObject(opts, obj)
        //create anchor links
        retObj = this.createAnchorUrl(retObj, opts.anchorUrl)

         if (opts.lineBreaksToBreakTags){
                retObj.doc = this.lineBreaksToBreakTags(retObj.doc)
        }
        //for markdown
         opts.template = opts.template.replace(/\{\{libTitle\}\}/g, opts.libTitle).replace(/\{\{libDescription\}\}/g, opts.libDescription)

        var objToRender = (opts.isMarkdown) ? this.mdCodeBlocksToHTMLTags($.extend({},retObj.doc)) : retObj.doc; 
        if (opts.isMarkdown){
                //escape special characters
               objToRender = this.mdEscape(objToRender)
        }
        var RESULT = this.opts.templateEngine(opts.template,objToRender, this)
        
        if (opts.el){
            $(opts.el).html(RESULT)
            if (opts.onLoad){
                opts.onLoad(opts.el,retObj.doc,retObj.meta)
            }

            if(prettyPrint != undefined){
                prettyPrint();
            }

            
            if (!opts.prettyprint){
                $(opts.el).find("code").each(function(){
                    if ($(this).hasClass("prettyprint"))
                        $(this).removeClass("prettyprint");     
                })
                
            }


            
        }
        return RESULT
    }

    /** doc.generateMD
    
     Generate Markdown based on documentation object 

    @group Methods.Exporters
    @param opts {object} [optional] - Options for exporting. @@coreObjectShared @@exporterShared
            linkFormat {string|bool} [default: true aka [{{LINK}}] (#{{LINK}})] -->if this is true functions/properties with #, ex. #functionNames will be converted to [{{LINK}}] (#{{LINK}}) markdown links to navigate documentation. You can also supply your own string template to be used, where {{LINK}} is the functionName.
            externalLinkFormat {string|bool} [default: true aka [{{NAME}}] ({{LINK}})]  --> Similar to linkformat (used for local anchor links), this converts external links. The syntax is like so: [ex. Site (http://site.com)], where {{LINK}} would be http://site.com and {{NAME}} would be "ex. Site"
            libTitle {string} [optional, default: "myLib.js"] --> A title of library to populate at the top of predefined template where {{libTitle}} would be placeholder.
            libDescription {string} [optional, default: "A library for.."] --> A description of library to populate at the top of predefined template where {{libDescription}} would be placeholder.

@example [id: generate Markdown documentation, lang: js ]
//lets make MD documentation, broken down by groups, and ignore private groups
var docMD = doc.generateMD({
    sortByGroup: true, //organized by groups
    filter: {groupIgnore: "private"} //ignore  private functions
})

    @returns {string} Generated Markdown syntax as a string.

    */


    this.generateMD = function(opts){
            opts = $.extend({
            isMarkdown: true,
            template: "{{#setPartial getNoUnderscoresIfInfo}}{{#if ~.info }}{{#replace ~.name,_, }}{{else}}{{~.name}}{{/if}}{{/setPartial}}\n\n{{#setPartial menu}} {{#each ~ as elName, el }}{{#if el.isDocObject}}\n  - [{{#partial getNoUnderscoresIfInfo, el}}{{#if el.function}}(){{/if}}](#{{el.anchorLink}}) {{#if el.Constructor}} *Constructor* {{/if}}{{else}}\n- **{{#replace elName,_, }}**{{#partial menu, el}}{{/if}}{{/each}}\n{{/setPartial}}\n\n\n{{libTitle}}\n============\n\n*{{libDescription}}*\n\n\n  ** *Menu* **  \n\n{{#partial menu, ~}} \n\n{{#setPartial param}}**{{name}}** {{#if type}}*{{type}}*{{/if}} {{#if optional}}*(optional)*{{/if}} - {{description}} {{#if sample || default}}... {{#if sample}}*e.g: * *{{sample}}*{{/if}}{{#if default}} *Default:* **{{default}}**{{/if}}{{/if}}{{/setPartial}}\n{{#setPartial functionItem}}\n\n<a id='{{~.anchorLink}}' name='{{~.anchorLink}}'></a>\n{{#partial getNoUnderscoresIfInfo, ~}}{{#if ~.function}}(){{/if}}\n-----\n---\n\n{{#if ~.Constructor == true}} *Constructor* {{/if}} {{#if ~.property &amp;&amp; ~.property!=true }} \n*Property {{~.property}}*\n{{/if}} \n{{#if ~.returns}} \n#### Returns: *{{~.returns.type}}* \n{{/if}}\n\n\n{{#if ~.function}}\n```\n{{name}}({{#if paramNamesArr}}{{#join paramNamesArr, , }}{{/if}})\n```{{/if}}\n\n\n{{~.description}}\n\n{{#each el.param}}\n+ {{#partial param, this}} {{#if this.subparams}}{{#each this.subparams as subparamName,subparamObj}}\n  + {{#partial param, subparamObj}}{{/each}}{{/if}}{{/each}}\n{{#if ~.returns}}\n**Return --&gt;** *{{~.returns.type}}* - {{~.returns.description}}\n{{#if  ~.returns.subparams}}{{#each  ~.returns.subparams as subparamName,subparamObj}}\n  + {{#partial param, subparamObj}}{{/each}}{{/if}}\n{{/if}}\n{{#each ~.example}}\n*Example {{$INDEX+1}}: {{this.id}}{{#if this.lang}} ({{this.lang}}){{/if}}*\n```{{this.lang}}\n{{#trim this.code}}\n ```\n{{/each}}\n{{/setPartial}}\n\n{{#setPartial groups2}}\n{{#log running groups2 with $~}}\n{{#each ~ as elName,el }}\n{{#if el.isDocObject}}\n{{#partial functionItem, el}}\n{{else}} #### &gt;&gt; {{#replace elName,_, }} {{#partial groups2, el}} {{/if}}\n{{/each}}\n{{/setPartial}}\n\n\n{{#partial groups2, ~}}",
            linkFormat: "[{{LINK}}](#{{LINK}})",
            lineBreaksToBreakTags: true
        }, opts);
        return this.generateHTML(opts).replace(/(\r*\n){2,}/g, "\n\n")
    }

    /** doc.toDataURIAnchorLink

        General Anchor http link for downloading, used after one has already generated text.

        @group Methods.Exporters
        @param opts {object} [optional] - Options for link
            fileName {string} [default: "download.txt"] --> desired filename (for when downloaded)
            content {string|object} --> text to encode as a data URI. If object is given, it will be JSON encoded.
            indent {int} [default: 3] --> if opts.content is an object, this controls the indent factor for when the object is json encoded.

        @example [id: generate download link for html, lang: js ]

//<a href='data:text/plain;base64,..' download='myDoc.html'>myDoc.html</a>

var link = doc.toDataURIAnchorLink({
        fileName: "myDoc.html", 
        content: doc.generateHTML(),
}) 

        @returns {string} HTML Anchor HREF link as string

    */
    this.toDataURIAnchorLink = function(opts){
        var opts = opts || {}
        opts = $.extend({
            indent: 3,
            fileName: "download.txt",
            content: ""
            },opts)

        if ($.isPlainObject(opts.content)){
            opts.content = JSON.stringify(opts.content,null, opts.indent)
        }
        return "<a download='"+opts.fileName+"' href='"+this._dataURI(opts.content)+"'>"+opts.fileName+"</a>"

    }


    /**  Escaping_Chars

    With this kind of text parsing you probably will run into a few times where you want to have the literal characters ex. \@ or and asterisk \*. Below are what you need to type to achieve this.

    @info   
    @group Other_Info
    @example [id: Examples of escaped chars, lang: js]

/*

Desired symbol                  Type
------------------------        ----
Asterisk            (\*)        \\* 
At symbol           (\@)        \\@
Forward Slash       (\/)        \\/
Commas in flag zone ( ,)        \\,
Colon in flag zone  ( :)        \\:
Hyphen              ( -)        \\-

\*\/    


    */


    /**  Data_Structure

    A small glimpse into what the data structure looks like (if exported as JSON or the js object template'd as MD/HTML). This may slightly change if #Group_Sorting is enabled. Here we document a really silly addNumbers function.

    @info   
    @group Other_Info

@example [id: block for addNumbers, lang: js]
/** addNumbers

This add two numbers together, with (very aribitrary) options as well

\@param A {int}[sample: 2] - First number
\@param B {int} [sample: 3,optional, default: 1]- Second number
\@param options {Object} [optional] - Series of options
    multiplier {number} [sample: 2] --> multiplier for each number before adding
    suffix {string} [sample: " inches"] --> suffix to add to end to number
    minusInstead {bool} [default: false] --> do subtraction instead

\@returns {number|string} Resulting number

\@example [id: adding a number, lang: js]

//add (4*3)+(7*3)
addNumbers(4,7,{multiplier: 3})

\*\/

function addNumbers(A,B,opts){..}

@example [id: resulting object for add numbers, lang: js]
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

    */


    /** Spaces_in_Names
        
        Functions and properties always have will never have spaces in their names, when you define the block. but what about plain info ( #@info ) in the documentation? And what about group names ( #@group )?  For both of these types, we convert underscores (_) to spaces ( ), so your doc looks nice and clean! So just use underscores, and don't worry about it! For links (#links) you still want to use the underscore though.

        @group Other_Info
        @info

 @example [id: Spaces in group and info name, lang: js]

 /** Super_important_information

 here is some informartion

\@info
\@group im_a_group_with_spaces

\*\/


    */


        /** Filtering_Objects

        Used in almost every single export method is the filter option. Filtering is done by feeding a 'literal object', dubbed a "filter object", where a user can supply a number of desired key value pairs. The key is the filter type, and the value is comma separated list..see example for the available types.


        @group Other_Info
        @info
        @example [id: A filter object, lang: js]

{
   groupOnly: "helpers.*,helpers" //only allow these groups, * is wildcard for subgroups
   groupIgnore: "helpers.*", // ignore these groups
   only: "getAvailableModels" //only grab these
   ignore: "anotherProperty, getAvailableModels" //ignore these 
}

    */

    /** Group_Sorting

        sortByGroup, a common export option,  is an option that if set true, sorts the object (and html/md representation) by the group attribute. By default this is set to false.

        @group Other_Info
        @info
        @example [id: How grouping works, lang: js] 

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
    */






    this.eachLine = function(lines, func){
        lines = lines || ""
        var ret = ""
        var tmpLines = lines.split("\n")
        $.each(tmpLines, function(k,v){
            var result = func(v)
            if (result !== false)
                ret += result+"\n"
        })
        return that.safeTrim(ret)
    }
    this.removeBeginningAsterisks = function(text){
        var asteriskRegex =/\*\s*?/
        var that = this
        return this.eachLine(text, function(line){
            if (that.safeTrim(line).startsWith("*")){
                return line.replace(asteriskRegex, "")
            }else
                return line
        })
    }

    this.parseMeta = function(rawData, pairsRegex){
            var funcObj = {}
            //funcObj.rawPairs = []
            var pairsSplit = rawData.split(pairsRegex)
            $.each(pairsSplit, function(k,v){
                if (k==0 && that.safeTrim(v)==""){
                    //ignoreee
                }else{
                    //key
                    if (k%2==1){
                        funcObj[v] =  that.parseSubParams(pairsSplit[k+1], "param")
                    }
                }
            })
            return funcObj
                
    }

    this.parseJS = function(result){
        //to grab a function
        var functionRegex = /\/\*\*([.\s\S]+?)\*\//g
        //var nameAndDescriptionRegex = /\/\*\*(.+)\n([.\s\S]+?)\n(@[.\s\S]+?)\*\//
        var nameAndDescriptionRegex = /\/\*\*(.+)\n([.\s\S]+?)\n+((?:\s)*@[.\s\S]+?)\*\//
        var metaRegex = /\/\*\*\s@META([.\s\S]+?)\*\//
        var sharedRegex = /\/\*\*\s@SHARED([.\s\S]+?)\*\//
        var pairsRegex = /^\s*@([a-zA-Z0-9-_]+)/gm
        var m,m2,m3
        var matches,matches3
        funcDic = {}
        var that = this
        var pairsSplit
        var funcObj = {}

        //META
        //FUNCTIONS/DOC
        matches = undefined

        while ( matches = functionRegex.exec(result)){
            //htmlentities
            matches[0] = matches[0].replace(/-->/g, "[SUBPARAM_ARROW]").replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(new RegExp("\\[SUBPARAM_ARROW\\]", 'g'), "-->")
            matches[0] = that.toggleEscapeCharsInObj(matches[0], "escape")

            var m2= nameAndDescriptionRegex.exec(matches[0])
            var meta = metaRegex.exec(matches[0])
            var shared = sharedRegex.exec(matches[0])
            if (meta){
                $.extend(this.meta, this.parseMeta(meta[1], pairsRegex))
            }
            else if (shared){

                $.extend(this.shared, this.parseMeta(shared[1], pairsRegex))
            }
            else if (m2){

                funcObj = {}
                //use this for making sure its an object
                funcObj.isDocObject = true
                funcObj.name = that.safeTrim(that.toggleEscapeCharsInObj(m2[1], "unescape"))
                funcObj.description = this.removeCommentLines(m2[2])
                funcObj.description =  this.removeBeginningAsterisks(funcObj.description)
                funcDic[funcObj.name] = funcObj
                funcObj.rest= m2[3]
                funcObj.rest = this.removeCommentLines(funcObj.rest)
                funcObj.rest = this.removeBeginningAsterisks(funcObj.rest)
                funcObj.rawPairs = []
                pairsSplit = funcObj.rest.split(pairsRegex)
                delete funcObj.rest
                $.each(pairsSplit, function(k,v){
                    if (k==0 && that.safeTrim(v)==""){
                        //ignoreee
                    }else{
                        //key
                        if (k%2==1){
                            funcObj.rawPairs.push({k: v, v: pairsSplit[k+1]})
                        }
                    }
                })
                
                
                funcDic[funcObj.name] = $.extend(funcObj,{})
            }
            else{
    
            }

        } 
        var RET =  that.rawPairsToDataObj(funcDic)
        $.each(RET, function(name, funcObj){
            //define as function

                if ((funcObj.property==undefined || funcObj.property==false) && (funcObj.info==undefined ||  funcObj.info==false)){
                    RET[name]["function"] = true
                }
        })
        //escape chars, handle them
        RET = that.toggleEscapeCharsInObj(RET, "unescape")
        return RET
        //trim up each line
        //if line has *** remove

        //remove all * 
        //rejoin all and split by attributepairsregex
        attributePairsRegex = "" 
    }


    //remove all the whitespace in front  keys and values
    this.stripWhiteSpaceAll =  function(obj){
        var stripFunction = function(v){
            if (typeof v == "string"){
                return v.trim().replace(/[\t\n\r]/g, "").replace(/\s+/, " ")
            }else
                return v
        }
        return this._forAll(obj, 
        //for arr and rest
        function(v){stripFunction(v)},
        //for obj
        function(k, v){
            return {
                k: stripFunction(k), 
                v: stripFunction(v)
            }
        })
    }


    //stringToTypeAll :
    this.stringToTypeAll  = function(obj){
        var that  = this
        return this._forAll(obj, function(v){
            var IS_JSON = true;
            try
            {
                var jsonObj = $.parseJSON(v);
            }
            catch(err)
            {
                IS_JSON = false;
            }  
            //boolean
            if (/(?:true|false)/i.test(v.trim())){
                return (v.toLowerCase().trim()=="true")
            }
            //number
            else if (!isNaN(Number(v.trim()))){
                return Number(v.trim())
            }
            //array or object (json)
            else if (IS_JSON){
                //return jsonObj
                return that.stripWhiteSpaceAll(jsonObj)
            }
            //string
            else{
                return v
            }
        })
    }
        //worker for "all" routines
    this._forAll = function(obj, arrFunc, objFunc, stringFunc, otherFunc){
        arrFunc = arrFunc || function(v){return v}
        objFunc = objFunc || function(k,v){
            return {k: k, 
                    v: (typeof v == "string") ? arrFunc(v) : v
                }
        }
        stringFunc = stringFunc || function(v){return arrFunc(v)}
        otherFunc = otherFunc || function(v){return v}

        var that = this
        if ($.isArray(obj)){
            var newObj = []
            $.each(obj, function(k,v){
                if (typeof v == "string"){
                    if (arrFunc(v)!=undefined)
                        newObj.push(arrFunc(v))
                }
                else {
                    var newVal = that._forAll(v, arrFunc,objFunc, stringFunc, otherFunc)
                    if (newVal!=undefined)
                        newObj.push(newVal)
                }
            })
        }else if (typeof obj == "object"){
            var newObj = {}
            $.each(obj, function(k,v){
                if (typeof v == "string"){
                    newObj[objFunc(k,v).k] =objFunc(k,v).v
                    if (newObj[objFunc(k,v).k] == undefined)
                        delete newObj[objFunc(k,v).k] 
                }
                else {

                    newObj[objFunc(k,v).k] = that._forAll(v, arrFunc,objFunc, stringFunc, otherFunc)
                    if (newObj[objFunc(k,v).k] == undefined)
                        delete newObj[objFunc(k,v).k] 
                    
                }
            })
        }else if (typeof obj == "string"){
            var newObj = stringFunc(obj)
        }else{
            var newObj = obj
        }
        return newObj
    
    }
    this.parse = {}

    this.flagParser = {
        example: {
            id: function(val){
                return {id: val}
            },
            lang: function(val){
                return {lang: val}
            }
        },
        param: {
            optional : function(val){
                return {optional: true}
            },
            sample: function(val){
                return {sample: val}
            },
            default : function(val){
                return {default: val}
            }
        }
    }

    //replace hash functions with links
    //tmpl ex. <a href='#{{LINK}}'>{{LINK}}</a>
    this.hashesToLinks = function(obj, tmpl){   
        var hashRegex = /#([^\s]+)/g
        var that = this
        var linkRegex = /{{LINK}}|{{NAME}}/g
        var matches
            tmpl = (tmpl!==true) ? tmpl : "<a href='#{{LINK}}'>{{LINK}}</a>"
        return this._forAll(obj, 
        //for arr and rest
        function(v){
            var newVal = v
            var matches
            while (matches = hashRegex.exec(v)){
                //if the hash is in the doc, then repplace with link
                if (Object.keys(that.doc).indexOf(matches[1])!=-1){
                    newVal = newVal.replace(matches[0], tmpl.replace(linkRegex, matches[1]))
                }else{
                    //do nothing..continue
                }
            }
            
            return newVal
        },
        function(k,v){
            var newVal = v
            var matches
            while (matches = hashRegex.exec(v)){
                //if the hash is in the doc, then repplace with link
                if (Object.keys(that.doc).indexOf(matches[1])!=-1){
                    if (k!="code") // dont do examples for links
                        newVal = newVal.replace(matches[0], tmpl.replace(linkRegex, matches[1]))
                }else{
                    //do nothing..continue
                }
            }
            
            return {k:k, v:newVal}
        })
    }

     //for code blocks, replace html tags for real. (used by markdown)
    this.mdCodeBlocksToHTMLTags = function(obj){ 
        return this._forAll(obj, 
        //for arr and rest
        function(v){
            return v
        },
        function(k,v){
            var newVal = v
            if (k=="code" && typeof v=="string"){ // only for code blocks
                newVal = newVal.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            }
            return {k:k, v:newVal}
        })
    }

    //escape markdown special chars 
    this.mdEscape = function(obj){
    var toEscape = [
        /\\/g,
        /`/g,
        /\*/g
       // /\{/g,
       // /\}/g,   
       // /\[/g,
      //  /\]/g,
      //  /\(/g,
      //  /\)/g,
      //  /#/g,
      //  /\+/g,
      //  /\-/g,
      //  /\./g,
      //  /\!/g,
    ]
     return this._forAll(obj, 
        //for arr and rest
        function(v){
            var newVal = v
            $.each(toEscape, function(index, escItem){
                newVal=newVal.replace(escItem, function(str){
                    return "\\"+str
                })
            })
            
        },
        function(k,v){
            var newVal = v
            if (k!="code" && typeof v=="string"){ // not for code blocks
                $.each(toEscape, function(index, escItem){
                    newVal=newVal.replace(escItem, function(str){
                        return "\\"+str
                    })
                })
                
            }
            return {k:k, v:newVal}
        })
    }


        //replace [linkName(http://link)] with actual links
    //tmpl ex. <a href='#{{LINK}}'>{{NAME}}</a>
    this.externalLinkify = function(obj, tmpl){ 
        var hashRegex = /#([^\s]+)/g
        var externalLinkRegex = /\[(?!ex\.)(.+)\((.+)\)\]/g
        var that = this
        var matches
            tmpl = (tmpl!==true) ? tmpl : "<a target='_blank' href='{{LINK}}'>{{NAME}}</a>"
        return this._forAll(obj, 
        //for arr and rest
        function(v){
            var newVal = v
            while (matches = externalLinkRegex.exec(newVal)){
                newVal = newVal.replace(matches[0], tmpl.replace(/{{LINK}}/g, matches[2]).replace(/{{NAME}}/g, matches[1]))
            }
            
            return newVal
        },
        function(k,v){
            var newVal = v
            while (matches = externalLinkRegex.exec(newVal)){
                if (k!="code") // dont do links for examples
                    newVal = newVal.replace(matches[0], tmpl.replace(/{{LINK}}/g, matches[2]).replace(/{{NAME}}/g, matches[1]))
            }
            
            return {k:k, v:newVal}
        })
    }


    //change \n to <br> (only for descriptions)
    this.lineBreaksToBreakTags = function(obj){
        return this._forAll(obj, null, 
        function(k,v){
            var newVal = v
                if (k=="description") // only do this for description
                    newVal = newVal.replace(/(\r\n|\n|\r)/g, "<br/>")
            
            
            return {k:k, v:newVal}
        })
    }


    //creates anchor urls depending on template
    this.createAnchorUrl = function(obj, tmpl){ 
        var hashRegex = /#([^\s]+)/g
        var that = this
        var linkRegex = /{{LINK}}/g
        var matches
        tmpl =   tmpl || "{{LINK}}"
        var newVal = {}
        $.each(obj, function(k,v){
            if ("isDocObject" in v){
                newVal[k] = v
                newVal[k].anchorLink =  tmpl.replace(linkRegex, newVal[k].name)
            }else{
                newVal[k] = that.createAnchorUrl(v, tmpl)
            }
        })
        return newVal
        
    }

    //returns object
    this.paramStrToObj  = function(attVal, delim, noKey ){
            delim = delim || "-"
            noKey = noKey || false
            var retObj = {}
            var keyValRegex = new RegExp("([.\\s\\S]+?)"+delim+"([.\\s\\S]+)")
            //noDelimter
            if (noKey){
                keyValRegex = /([.\s\S]+)/g
            }
            
            var key = attVal
            var flags = {}
            var tmpObj = {}
            var matches,matches2,matches3
            if ( matches = keyValRegex.exec(attVal)){
                key = matches[1]
                retObj.description = that.safeTrim(matches[2])
                if (noKey){
                    retObj.description = that.safeTrim(matches[1])
                    key =  that.safeTrim(matches[1]) 
                }


                
                //EXTRACT TYPES
                var extractedData = that.extractSpecialData(key, "type")
                if (extractedData.args){
                    retObj.type = extractedData.args
                }
                //REMOVE TYPES FROM KEY
                key = extractedData.newText



                if (noKey)
                    retObj.description = key
                
                //EXTRACT FLAGS
                //getFlags .. extractedData returns {args: {}, newText: ""}
                var extractedData = that.extractSpecialData(key, "flag")
                if (!$.isEmptyObject(extractedData.args)){
                    //do something for each flag
                    $.each(extractedData.args, function(flagId,flag){
                        if (that.flagParser.param[flagId]!=undefined){
                            retObj = $.extend(retObj, that.flagParser.param[flagId](flag))
                            //flags = $.extend(flags,that.flagParser.param[flagId](flag))
                        }else{
                            flags[flagId] = flag
                        }
                    })
                    retObj.flags = flags
                }
                //REMOVE FLAGS FROM KEY
                key = extractedData.newText
            }
            if (noKey){
                return {k: that.makeID(), v: that.safeTrim(retObj)}
            }else{
                return {k: that.safeTrim(key), v: that.safeTrim(retObj)}
            }
    }

    this.makeID = function()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }


    //used for grabbing flags and types 
    this.extractSpecialData = function(str, flagOrType){
        var matches3
        //comma escape
        //flags are encapsulated in [], types are encapsulated in {}
        var regexOptions = {
                open: (flagOrType=="flag") ? /\[/   : /\{/,
                close:  (flagOrType=="flag") ? /\]/ : /\}/,
            }

        
        //pm will smartly step over nested brackets, vs a traditional regex
        var pm = new this.ParentheticalMayhem(str, {
            debugMode: false,
               openRegex:  regexOptions['open'],
              delimiterRegex: /,/,
              closeRegex: regexOptions['close'],
              commandParsingLimit: 1,
              disableSuffixContentParsing: true
        })
        //resObj.args will be the comma separated arguments
        var resObj = pm.getResultObject()
        if ($.isPlainObject(resObj)){

            //if its flags, we need to get them in their pairs
            if (flagOrType=="flag"){
                var flags = {}
                $.each(resObj.args, function(flagId,flagStr){
                    if (flagStr.indexOf(":")!=-1 ){
                        var flagPieces = flagStr.split(":")
                        flags[that.safeTrim(flagPieces[0])] = that.safeTrim(flagPieces[1] )
                    }else{
                        flags[that.safeTrim(flagStr)] = true
                    }
                })
            }else{
                var types =  resObj.args.join(", ").trim()
            }
            return {
                args:  (flagOrType=="flag") ? flags : types,
                newText: (resObj.preText || "")+(resObj.suffixContent || "")
            }
        }else{
            //pm returned a string, meaning it didnt find anything..
            return {
                args:  (flagOrType=="flag") ? {} : false,
                newText: str
            }
        }


        
    }


    this.attType = {
        example: [],
        param: []

    }



    this.parse =  {

        /** @Constructor

        This flags the function as a constructor.

        @group Syntax.Attributes
        @info

        @example [id: @Constructor, lang: js]

/** MyClass

\@Constructor

\*\/
var MyClass = function(opts){...}
        
        */

        Constructor: function(){
            return true
        },

        /** @property

        Each doc object can either be a function (the default), #@property , or #@info type item. This flags this doc object as a property, rather than the default method/function. It follows the following format:

        \@property <type>

        @group Syntax.Attributes
        @info

        @example [id: @property string , lang: js]

/** myProperty

\@property String

\*\/
this.myProperty = "hello"
        
        */

        property: function(val){
            if (that.safeTrim(val)!="")
                return that.safeTrim(val)
            else
                return true
        },
        /** @info

        Each doc object can either be a function (the default), #@property , or #@info type item. Sometimes in our documentation we just have plain old information to expel that is not necessarily part of the source code as a function or property. This flags this doc object as an informative type, rather than the default method/function or a property. Using underscore for the naming of this type will automatically be converted to spaces in the menu and html exporters. #@example and #group can be used on these as well!

        @group Syntax.Attributes
        @info

        @example [id: @info, lang: js]

/** Here_is_some_info

\@info 

\*\/
        
        */

        info: function(){
            return true
        },

/** @group

Similar functions/properties/etc can be grouped for better organization by specifying a groupName.  When exporting to html/md/JSON/etc, groups allow one to sort and filter the data structure. See #Group_Sorting and #Filtering_Objects for more info on how groups might be used. Subgroups can indefinitely be used (following dot notation)

\@group <groupName>
\@group <groupName.SubGroupName>
\@group <groupName.SubGroupName.SubSub..>

@group Syntax.Attributes
@info



@example [id: @group simple use case, lang: js]

/** myPrivateFunction

\@group private

\*\/
function myPrivateFunction(){...}


@example [id: @using subgroups, lang: js]

/** generateHTML

\@group Methods.Exporters

\*\/
function generateHTML(){...}
                
*/
        group: function(val){
            return that.safeTrim(val)
        },
/** @param

The @param is the argument in a function. For instance, there are three in the following: functionName(param1, param2, param3). Very frequently, you may have multiple parameters, and can use the #@param attribute multiple times as needed. There are two special zones. Curly braces {} are used to describe the type of the value. Flags are comma delimited key:value pairs within brackets []. Both of these [flags] and {type} zones can precede or come after the param/subparam name.

syntax is typically:
\@param {type} [flags] name - title

Subparameters are also available, aka parameters of a parameter. a use case would be if you receive  options as a single parameter and want to describe the individual key values (subparams). this is done on a per line basis with a --> instead of hyphen.

\@param {type} [flags] name - title
        {type} [flags] key1 --> value1
        {type} [flags] key2 --> value2
        {type} [flags] key3 --> value3

Certain flags are included and used by default, of course custom flags can be added.
    "optional" - this parameter is optional
    "sample" - this is a sample value for this parameter . an example of what can be used
    "default" - this is the default value if none is given.

@group Syntax.Attributes
@info

@example [id: @param simple example, lang: js]

/** add(A,B)

\@param A {number} [default: 1, sample: 3] - First Number to add
\@param B {number} [default: 1, sample: 2] - Second Number to add

\*\/

function add(a,b){return a+b}

@example [id: @param options using subparameters, lang: js]

/** setPerson

\@param {Object} [optional] - an object describing a person
  name {string} [default: Nobody, sample: Steve] --> Persons name
  age {int} [default: 1, sample: 18] --> Age in years
  height {string} [default: 6'0", sample 4'0"] --> Persons height (feet inches)

\*\/
function setPerson(opts){
    var defaultOpts = {
        name: "Nobody",
        age: 1,
        height: "6'0\""
    }
}
*/
        param: function(attVal){    
            //must use that
            //grab retObj 
            var subParamObj
            var retObj = that.paramStrToObj(attVal)
            var paramObj = retObj.v
            var paramKey = retObj.k
        

            //store subparams from description
            var tmpParamObj  = that.parseSubParams(paramObj.description, "param")
            
            //reassign description
            paramObj.description = tmpParamObj.description
            if ( !$.isEmptyObject(tmpParamObj.subparams))
                paramObj.subparams = tmpParamObj.subparams
            //setName

            paramObj.name = paramKey
            //return that.generateOneAttributeObject(paramKey, paramObj)
            return paramObj
        },
/** @returns 

What this functions returns. Curly braces {} are used to describe the type of the value, similar to #@param . Return also can have subparameters, similar to #@param .. a use case would be if you're returning an object and want to describe the individual key values].

\@returns {<type>} <description>

@group Syntax.Attributes
@info

@example [id: @returns simple example, lang: js]

/** helloWorld

\@returns {string}  Returns "hello world!"

\*\/
function hellowWorld(){ return "hello world"}

@example [id: @return an object with subparameters, lang: js]

/** getPerson

\@returns {Object} Returns an object describing a person
  name {string} --> Persons name
  age {int} [default: 1, sample: 18] --> Age in years
  height {string} --> Persons height (feet inches)

\*\/
function getPerson(){ return {
  name: "bob", 
  age: 25, 
  height: "5'11\""
}}
        */
        returns: function(val){
            //parse as a param with no key
            var retObj = that.paramStrToObj(val,null,true)
            
            if (retObj.v!=undefined){

                retObj = retObj.v
                //check for  subparams
                
                var tmpParamObj  = that.parseSubParams(retObj.description, "param")
                
                if ( !$.isEmptyObject(tmpParamObj.subparams))
                    retObj.subparams = tmpParamObj.subparams
                retObj.description = tmpParamObj.description
                
            
            }

            return retObj
        },

        tags: function(val){
            return that.safeTrim(val)
        },

/** @example

Examples are code snippets to illustrate an example. You can have as many examples as you would like per property/function/info doc object. Certain flags (in brackets [] ) are specified to tell the programming language (if using prettyprint, this should match their convention i.e. html for HTML and js for javascript, etc..) and a unique id (title) of the example. The lang flag helps for pretty printing later, if enabled.

Flags
    - id: A unique description for this coding example
    - lang: Programming language (ex. js for javascript)


\@example [id: <example descriptor>, lang: <programming Language> ]
<my multiline code snippet>

@group Syntax.Attributes
@info

@example [id: a typical @example, lang: js]

/** addNumbers

\@example [id: Add two numbers, lang: js]

 var total = addNumbers(3,4) //total: 7
\*\/

function addNumbers(a,b){
    return a+b
}
            
*/
        example: function(attVal){
            var retObj = {}
            //getFlags .. extractedData returns {args: {}, newText: ""}
            var extractedData = that.extractSpecialData(attVal, "flag")
            if (!$.isEmptyObject(extractedData.args)){
                //do something for each flag
                $.each(extractedData.args, function(flagId,flag){
                    if (that.flagParser.example[flagId]!=undefined){
                        retObj = $.extend(retObj, that.flagParser.example[flagId](flag))
                    }
                })
                retObj.flags = extractedData.args

            }
            //removeFlags
            retObj.code = extractedData.newText
            return retObj
        }
        
    }

    /** \@META 

    Meta data is data that you can specify that doesn't necessarily relate to a specific variable,info, or method in your script. This might be info important for you, but not necessarilly visible for the public. The intention is to be able to use it in your own way when exported to Object and make it visible only if you desire. See #Data_Structure to see where meta info is stored.

     It can be multiple lines and be plain text or written to be  multiple sub parameters (similar to #@param) via the following subpart syntax:  subkey[flagName:flagValue] \--> This is the subkey Description


    @info
    @group Syntax.Special_Blocks

@example [id: entering meta data, lang: js]

/** \@META
\@key1 value
\@key2 value with
multiple lines
\@key3 subkeyA [flagName:flagValue, flagName2:flagValue2] --> sub-descrip
 subkeyB [flagName:flagValue, flagName2:flagValue2] --> sub-descrip
\*\/

@example [id: resulting object, lang: js]
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

*/


    /** \@SHARED

        
    Shared data can be used inside #@returns and #@param 's descriptions, across multiple function/properties where inputs/outputs might be repeated. It follows the same format as the #@META block . If you have subparams / descriptions that should be shared for these sorts of types, you can specify the shared data in a #@SHARED block like in example 1 below.

    Example 1: Define a shared data item. (@mySharedData)
    Example 2: Then in your function you can access this by placing double @ symbol in front of the desired key, basically  \@@[SHARED_KEYNAME] in a parameter or returns description.
    Example 3: The resulting merged doc item. What will happen is it will basically replace the @@.. with the shared data description  as well as copy over any subparams found.
    

    @info
    @group  Syntax.Special_Blocks

@example [id: entering shared data, lang: js]

/** \@SHARED
    \@mySharedData - and here is a description to be shared
        sharedKey1 --> Im subparam value #1
        sharedKey2 --> Im subparam value #2
\*\/

@example [id: link data inside param description, lang: js]

/** mySpecialFunction
    \@param myParam - this is my param description, @@mySharedData
\*\/

@example [id: Final merged "mySpecialFunction()", lang: js]

/** mySpecialFunction
\@param myParam - this is my param description, and here is a description to be shared
    sharedKey1 --> Im subparam value #1
    sharedKey2 --> Im subparam value #2
\*\/

*/
    //remove lines that match this thing
    this.removeLinesWith = function(expr, replacer){
        var newString = that.raw
        var isArray = $.isArray(expr)
        if (!isArray)
            expr = [expr]
        $.each(expr, function(k,v){
            var tmpRegex = new RegExp(v.replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\*/g, "(.+)"),"g")
            newString = that.eachLine(newString, function(line){
                if (tmpRegex.test(line)){
                    return (replacer!=undefined) ? line.replace(tmpRegex, replacer.replace(/#MATCH#/g, line)) : false
                }
                else{
                    return line
                }
            })
        })
        return newString
 

    }

    //
    this.toggleEscapeCharsInObj = function(obj, escOrUnEsc){
            var that = this
            var dic = {
                unescape: {
                    //k: new, v: what to replace
                    "*": /\\\*/g, 
                    "/": /\\\//g, 
                    "@":  /\\@/g,
                    ",": /\[COMMA\]/g,
                    ":": /\[COLON\]/g,
                    "-": /\[HYPHEN\]/g
                },
                escape: {
                    //k: new, v: what to replace
                    "[COMMA]": /\\,/g,
                    "[COLON]": /\\:/g,
                    "[HYPHEN]": /\\-/g,
                }
            }
            var newObj
            //its an object or arr
            if ($.isPlainObject(obj) || $.isArray(obj)){
                //initialize if array
                if ($.isArray(obj)){
                    newObj = []
                    var x
                    for (x=0;x<obj.length; x++){
                        newObj.push(false)
                    }
                }else{
                    newObj = {}
                }
                $.each(obj, function(k, v){
                    newObj[k] = that.toggleEscapeCharsInObj(v,escOrUnEsc)
                })
            
            }
            //its a
            else if (typeof obj == "string"){
                $.each(dic[escOrUnEsc], function(replaceWith, regexRep){
                    obj = obj.replace(regexRep,replaceWith)
                })
                newObj = obj
            }else{
                newObj = obj
            }
        
            return newObj
    }

    //get shared data and new description
    this.getSharedDataAndNewDescription = function(description){
        var sharedRegex = /@@([^\s]+)/
        var sharedData = {}
        var resObj = {}
        var m
        var count=0;
        while ( m = sharedRegex.exec(description)){
            count++
            if (this.shared[m[1]]){
                var sharedData = $.extend(true,sharedData, this.shared[m[1]])
                var sharedDescrip =  sharedData.description
                delete sharedData.description
                
                description = description.replace(new RegExp("@@"+m[1],'g'), sharedDescrip)
            }

        }
        resObj = $.extend(resObj, sharedData)
        return {
            newDescription: description,
            resObj: resObj
        }
    }

    this.parseSubParams = function(str,flag){
            //basic,raw, or param
            var flag = flag || "basic"
            var paramObj = {
                subparams: {}
            }
            var withoutSubParams = that.eachLine(str, function(val){
                return (val.indexOf("-->")!=-1) ?  false : val
            })
            var justSubParams = that.eachLine(str, function(val){
                return (val.indexOf("-->")!=-1) ?  val : false
            })

            //get clean description
            paramObj.description = that.safeTrim(withoutSubParams)

            //get shared data
            var newSharedDataAndRevisedDescription = $.extend({}, this.getSharedDataAndNewDescription(paramObj.description))

            paramObj.description = newSharedDataAndRevisedDescription.newDescription
    
            if (flag=="basic" || flag=="param"){
                //generate subparameters
                if (that.safeTrim(justSubParams)!=""){
                    $.each(justSubParams.split("\n"), function(k,v){
                        if (flag=="basic"){
                            subParamObj = v.split("-->")
                            paramObj.subparams[subParamObj[0]] =subParamObj[1]
                            paramObj.subparams[subParamObj[0]]["name"] = subParamObj[0]
                        }else if (flag=="param"){
                            subParamObj = that.paramStrToObj(v, "-->")
                            paramObj.subparams[subParamObj.k] = subParamObj.v
                            paramObj.subparams[subParamObj.k]["name"] = subParamObj.k
                        }
                    })
                    //paramObj.subparams = justSubParams
                }
            }else if (flag=="raw"){
                paramObj.subparams = justSubParams
            }
            //merge shared params into paramobj
            paramObj = $.extend(true, {}, newSharedDataAndRevisedDescription.resObj, paramObj)
            
            return paramObj
            
    }

    this.generateOneAttributeObject = function(key, val){
        var RET = {}
        RET[key] = val
        return RET
    }

    this.rawPairsToDataObj = function(funcDic){
        var that = this
        $.each(funcDic, function(funcName, funcObj){
            $.each(funcObj.rawPairs, function(index, attObj){
                var attName = attObj.k
                var attVal = attObj.v
                if (that.parse[attName]!=undefined){

                    var result = that.parse[attName](attVal);
                    if (that.attType[attName]!=undefined){
                        //found an array
                        if ($.isArray(that.attType[attName])){
                            if (funcDic[funcName][attName]==undefined)
                                funcDic[funcName][attName] = []
                            funcDic[funcName][attName].push(result)
                        }
                        //found an object
                        else if ($.isPlainObject(that.attType[attName])){
                            funcDic[funcName][attName] = $.extend(funcDic[funcName][attName], result)   
                        //single boring value
                        }else{
                            funcDic[funcName][attName] = result
                        }   
                    }else{
                        funcDic[funcName][attName] = result
                    }
                    
                }
            })
                if (funcDic[funcName].param){
                    funcDic[funcName].paramNamesArr = []
                    $.each(funcDic[funcName].param, function(k,v){
                        funcDic[funcName].paramNamesArr.push(((!v.optional) ? v.name : "["+v.name+"]"))
                    })
                }
            //remove rawpairs
            delete funcDic[funcName].rawPairs
        })

        return funcDic
    }
    this.readJS = function(file){
        var that = this
        $.ajax(file,{
            url: file,
            dataType: "text",
            success: function(result){
                that.raw = result
                that.doc = $.extend({},that.parseJS(result))
                opts.onSuccess($.extend({},that.doc), that)
            },
            error: function(e,req){
                opts.onError("Error reading "+this.url+": ",e.statusText)

            }
        })
    }

    /** Default_Templates

        We use default templates for html,menu, and markdown exporters. Wanna see what they look like, maybe slightly tweak them to your own liking? Go for it by clicking the links to them below!

        HTML: [html-template]
        Menu (HTML): [html-menu-template]
        Markdown: [markdown-template]

        @group Templating
        @info
    */

    /** About_Templating

        A Template engine is used for easily laying out the doc data into  html, md, etc. By default, Documentron uses its own built in parser (more info below). If desired, an alternative template engine such as [Handlebars.js(http://handlebarsjs.com/)] may be specified in the options. 

        Keep in mind, that if you use a custom engine, you likely will need to supply  your own template string as well for each html/md/etc generator:
        
        @group Templating
        @info
        @example [id: Changing the template engine, lang: js] 

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


    */

    /** boldify

        Bold something

        @info
        @group Templating.Commands
        @example [id: boldify, lang: html]
{{#boldify mytext}}

    */


    /** underlineify

        Underline something

        @info
        @group Templating.Commands
        @example [id: underlineify, lang: html]

{{#underlineify mytext}}

    */


    /** trim

        Trim whitespace from beginning and end of string

        @info
        @group Templating.Commands
        @example [id: boldify, lang: html]

{{#trim mytext}}

    */

    /** replace

    replace substrings with another substring

    @info
    @group Templating.Commands
    @example [id: replace underscores with space, lang: html]

{{#replace mytext,_, }} 

    */



    /** if
        
        if then else statement. elif and else optional.

        @info
        @group Templating.Commands
        @example [id: if, lang: html]

{{#if myNum >10 }}
    my num is huge!
{{elif myNum < 5}}
    my num is small
{{else}}
    my num is mmm.. questionable.
{{/if}}
    */

    /** each
        
    an each loop. you can do "as key, val" or "as val" if you don't need key. special vars are available in this each loop.

    @param specialVars - special vars available within each loop
            this --> the current item
            $INDEX --> the current index of this object
            $COUNT --> current count (index+1)
            $LAST --> boolean for (is this the last item)
            $FIRST --> boolean for (is this the first item)

    @info
    @group Templating.Commands
    @example [id: each, lang: html]

{{#each myObj as key, val}}
    the item: {{this}}
    the item (again): {{val}}
    the key: {{key}}
    is this the last element? {{$LAST}}
{{/each}}

    */

    /** set
    Sets/initializes a variable's value.


    @info
    @group Templating.Commands
    @example [id: set x to 0, lang: html]

{{#set x = 0}}

@example [id: concatnate a new string, lang: html]

{{#set helloWorld = "hello "+ "world"}}

*/


    /** setPartial
        
        creates a repeatable block (partial) of template. ~ is the way to gain access to root object passed to this partial. (see #partial on using it). make sure to put at beginning of template (before you call it.)
    
        @info
        @group Templating.Commands
        @example [id: setPartial, lang: html]

{{#setPartial makeAList}}
    <ul>
    {{#each ~ as item}}
        <li>{{item}}</li>
    {{/each}}
    </ul>
{{/setPartial}}
    */


    /** jsonify


    json representation  of object / array. great for template debugging.

    @info
    @group Templating.Commands
    @example [id: jsonify, lang: html]

{{#jsonify myObject}}
    
    */

    /** join
     join an array with a delimiter

    @info
    @group Templating.Commands
    @example [id: Join an array with hyphens, lang: html]

{{#join myArray,-}}
    
    */

    /** partial
        
         uses a predefined block (partial) of template code (See #setPartial to see how to create one). To call it is like {{partial [PARTIAL_NAME], [ROOT_OBJECT]}}. 
    
        @info
        @group Templating.Commands
        @example [id: partial, lang: html]

{{#partial makeAList, myList}}
    */
//kind of like a simple handlebars
    this.simpleTmplParser = function(text,obj,extraData, intermParse){
        extraData = extraData || {}
        var that = this
        intermParse = intermParse || false
        extraData._helpers = extraData._helpers || {}
        var helpersRegex = /([^0-9%$-+\/\*~!(\s]+)\((.*)\)/g
        var quoteRegex = /("(.*?)"|'(.*?)')/g
        var strLiteralRegex = /!!!(.+?)!!!/g
        extraData._partials = extraData._partials || {}

        var _log = function(){
            //do nothing 
            return false
        }

        var toggleEscapeBracketsinObj = function(obj, escOrUnEsc){
            var newObj
            //its an object or arr
            if ($.isPlainObject(obj) || $.isArray(obj)){
                //initialize if array
                if ($.isArray(obj)){
                    newObj = []
                    var x
                    for (x=0;x<obj.length; x++){
                        newObj.push(false)
                    }
                }else{
                    newObj = {}
                }
                $.each(obj, function(k, v){
                    newObj[k] = toggleEscapeBracketsinObj(v,escOrUnEsc)
                })
            
            }
            //its a
            else if (typeof obj == "string"){
                if (escOrUnEsc=="escape")
                    newObj = obj.replace(/\{\{/g, "[DOUBLE_BRACKET_OPEN]").replace(/\}\}/g, "[DOUBLE_BRACKET_CLOSE]")
                else{
                    newObj = obj.replace(new RegExp("\\[DOUBLE_BRACKET_OPEN\\]", 'g'), "{{").replace(new RegExp("\\[DOUBLE_BRACKET_CLOSE\\]", 'g'), "}}")
                }
            }else{
                newObj = obj
            }
        
            return newObj
        }

        var replaceHelperForRealFuncs = function(str){
            str = str.replace(helpersRegex, function(m,m1,m2){
                return "extraData._helpers['"+m1+"']("+replaceHelperForRealFuncs(m2)+")";
            })
            return str
        }



        //find each variable and transform to real
        var swapForTrueVars = function(str){
            var matches
            str = $(document.createElement('div')).html(str).text()

            //swap out helpers for actual functions
            str = replaceHelperForRealFuncs(str)

            //replace quotes with !!!0!!!!
            var stringLiterals = []
            str = str.replace(quoteRegex, function(m,m1,m2){
                _log("quoteRegex Results from ",str," to ---> ",m,m1,m2)
                var id = stringLiterals.length
                stringLiterals[id] = m
                return "!!!"+id+"!!!"
            })

            var newStr2 = str+""
            //find variables
            var varblRegex = /([a-zA-Z_~\.$@]+[-0-9.a-zA-Z_]*)/g
            var blacklist = ["true", "false", "extraData","obj"]
            var prefixBlackList = ["extraData."]
            var regexBlackList
            
            matches = false 
            /*
            while (matches = varblRegex.exec(str)){
                //if not in blacklist and we find a match
                if (matches && blacklist.indexOf(matches[1].toLowerCase())==-1){
                    $.each(prefixBlackList, function(k,v){
                        if (matches[1].substring(0, v.length) === v)

                    })
                }
            }
            */

            newStr2 = newStr2.replace(varblRegex, function(m){
                var ok = true
                $.each(prefixBlackList, function(k,v){
                        //in blacklist so ignore
                        if (m.substring(0, v.length) === v)
                            ok = false
                    })
                //if not already have a prefix..and not on the blackList
                if (ok && blacklist.indexOf(m.toLowerCase())==-1){
                    _log("looking up..",m)
                    return getVar(m, true)
                }else{

                    //no need to edit
                    return m
                }

            })
            //put back the stringLiterals
            newStr2 = newStr2.replace(strLiteralRegex, function(m,m1){
                _log(m, "m1:",m1)
                return stringLiterals[Number(m1)]
            })
            _log("newVarStr2 = ",str," to ",newStr2)
            return newStr2
        }

        //get a value from a string..could be a variable or expression 
        var resolveStrToVal = function(str){
             str = str || ""
            var str = str.replace(/"/g, '\"').replace(/'/g, "\'")
            _log("obj:",obj)
            _log(obj.name)
            _log("resolving...",str)
            var expression = swapForTrueVars(str)
            _log("we got..",expression)
            return eval(expression)
        }


        var throwError = function(message){
                this.SelectorException.prototype = Object.create(Error.prototype)
                throw new function(){
                    Error.captureStackTrace(this);
                    this.message =  message,
                    this.name = "TemplateException"
                }
        }
        //this takes a command and text and parses the goodness
        var parseCmd = function(text, cmd){
         

            var grabSubTexts = function(k,segment){
              
              var computeRegexes = function(regex, text){
                var tmpMatches, tmpRes
                if (regex!=undefined && regex.constructor==RegExp){
                  if (regex.global){
                     tmpRes = []
                    while (tmpMatches = regex.exec(text)){
                      tmpRes.push(tmpMatches)
                    }
                  }else{
                     tmpRes = regex.exec(text)
                  }
                }
                return tmpRes

              }

                var startingIndex =positionNumbersAll.indexOf(segment.indexExclusive)
               var ret = {
                  cmdArgs: segment.cmdArgs,
                  text: (cmd.endCmd==undefined) ? "" :  text.slice(positionNumbersAll[startingIndex],positionNumbersAll[startingIndex+1] )
                }
                //ADD REGEX MATCHES
                //cmdRegex + regex for main command
                if (k==cmd.cmd){
                  if (cmd.cmdRegex)
                     ret.cmdMatches = computeRegexes(cmd.cmdRegex, ret.cmdArgs)
                  if (cmd.regex)
                     ret.matches = computeRegexes(cmd.regex, ret.text)
                }else{
                  //cmd regex for segments
                  if (cmd.extraCmdRegex)
                    ret.cmdMatches = computeRegexes(cmd.extraCmdRegex[k], ret.cmdArgs)
                  //regex for segments
                   if (cmd.extraCmdRegex)
                    ret.matches = computeRegexes(cmd.extraRegex[k], ret.text)
                }
                //delete the following keys if there are none 
                var toDeleteIfBlank = ["cmdArgs", "cmdMatches", "matches"]
                for (var i=0; i<toDeleteIfBlank.length; i++){
                  if (toDeleteIfBlank[i] in ret){
                    if (ret[toDeleteIfBlank[i]] == undefined ||
                        (ret[toDeleteIfBlank[i]] == false)
                      )
                      delete ret[toDeleteIfBlank[i]] 
                  }
                }
              return ret
            }
          var retObj = {
            segments: {}
          }
          //find each

         
          
          var matches
          var positionNumbersAll = []
          
          var level = 0
         var count = 0 
          var positions = {
           startInclusive: 0,
            endInclusive: 0,
            startExclusive: 0,
            endExclusive: 0,
            segments: {}
          }
          var foundEnd = false
           var m
           positions.segments[cmd.cmd] = {}

           //cmd endCmd!! Here we create the end and middle position objects to hold numbers we find
           if (cmd.endCmd != undefined){

                if (cmd.extraSegments){
                  $.each(cmd.extraSegments.split(","), function(index, segment){
                    if ( m = /(.+)\*$/.exec(segment)){
                      positions.segments[m[1]] = []
                    }else{
                      positions.segments[segment] = {}
                    }
                  })
                }
                 positions.segments[cmd.endCmd] = {}
          }



            startIndex = 0
           //var balancingRegex = new RegExp("\{\{\\s*("+Object.keys(positions.segments).join("|")+")\\s*(.+)*\}\}","g")
          // var balancingRegex = new RegExp("\{\{\\s*("+Object.keys(positions.segments).join("|")+")\\s*([^{\\n]+)*\}\}","g")
            var balancingRegex = new RegExp("\{\{\\s*("+Object.keys(positions.segments).join("|")+")\\s*([^{\\n]*)\\s*\}\}","g")
           //NO END CMD
            _log("balancingRegex: ",balancingRegex)
           
            if (cmd.endCmd==undefined){
                foundEnd = true
                 matches = balancingRegex.exec(text)
            
                 var segmentPositionObj = {
                      index: matches.index, 
                      indexExclusive:  matches.index+matches[0].length, 
                      val: matches[0], 
                      cmd: matches[1],
                      cmdArgs: matches[2] || false
                  }

                 positions.segments[matches[1]] = segmentPositionObj
                 positions.startExclusive = matches.index+(matches[0].length)
                 positions.startInclusive  = matches.index
                 positions.endExclusive = matches.index+matches[0].length
                 positions.endInclusive  = matches.index+matches[0].length
  
          
          }
           while ( count<50 && foundEnd==false && (matches = balancingRegex.exec(text))){
            //nested
            if (count>50)
                break;
            if (matches[1]==cmd.cmd){
              if (count==0){
                
                positions.startExclusive = matches.index+(matches[0].length)
                 positions.startInclusive  = matches.index+0
                // positions.segments[cmd.cmd] =positions.startExclusive
              }
               level++
              }else if (matches[1]==cmd.endCmd){
                level--
              }

             //if in a command main level (level 1)..and the match is a middle .last segment...
            if ((level==1 && Object.keys(positions.segments).indexOf(matches[1])!=-1 && cmd.endCmd!=matches[1] ) || 
               (level==0 && cmd.endCmd==matches[1])){
                  var segmentPositionObj = {
                    index: matches.index, 
                    indexExclusive:  matches.index+matches[0].length, 
                    val: matches[0], 
                    cmd: matches[1],
                    cmdArgs: matches[2] || false
                  }
                  if ($.isArray( positions.segments[matches[1]]))
                      positions.segments[matches[1]].push( segmentPositionObj)
                  else{
                        _log("level:",level)
                        _log(matches[1], segmentPositionObj)
                       positions.segments[matches[1]] = segmentPositionObj
                  }
                   positionNumbersAll.push( segmentPositionObj.index)
                   positionNumbersAll.push( segmentPositionObj.indexExclusive)
             }

             //END OF COMMAND..wrap things up
            if (level==0 && cmd.endCmd==matches[1]){

              
               positions.endExclusive = matches.index
               positions.endInclusive  = matches.index+matches[0].length
              retObj.all = text.slice(positions.startExclusive,positions.endExclusive)
              retObj.allIncludingCmd =  text.slice(positions.startInclusive,positions.endInclusive)
              foundEnd = true
            }



            count++
           
          } 


            //GENERATE return object
            //we have the position data now we need to navigate and create the return object
            $.each(positions.segments, function(k,segment){
              if (k!=cmd.endCmd){
                if ($.isArray(segment) && segment.length>0){
                  retObj.segments[k] = []
                  $.each(segment, function(k2,v2){
                     retObj.segments[k].push(grabSubTexts(k,v2))
                  })
                }else if (!$.isEmptyObject(segment)){
                  retObj.segments[k] = grabSubTexts(k,segment)
                }
              }
            })

            //ADD IN POSITIONS
            retObj.positions = {
              start: {
                inclusive: positions.startInclusive,
                exclusive: positions.startExclusive
              },
              end: {
                inclusive: positions.endInclusive,
                exclusive: positions.endExclusive
              }
              
            }
            //ADD IN RESULTS (whatever the first command non-segment is)
            retObj.results = retObj.segments[cmd.cmd]
 
            return retObj



         } //<----END PARSE CMD

        //take a fake var and turn to real
        //just text returns the string of var, vs actual variable value
        var getVar = function(v, justText){
            justText = justText || false
            var tmp = undefined
            //var varblRegex = /^([a-zA-Z_~\.$@]+[-0-9]*)$/g


            var varblRegex = /^([a-zA-Z_~\.$@]+[-0-9.a-zA-Z_]*)$/g 
            var fakeIndexRegex = /\.([0-9]+)/g

            //does this var contain spaces or bad characters? wronggg
            if (/\s/g.exec(v) || !v.match(varblRegex))
                return false


            //~ is basically highest level of the object
            if (v=="~"){
                return (!justText) ? obj : "obj"
            }
            //replace wild card with NOTHING..this is a local property
            v = v.replace(/~\./g, "")

            ////now we will replace indexes with their counterparts
            // i.e. a.0.blah --> a[0].blah, a.0 --> a[0]
            v = v.replace(fakeIndexRegex, function(m,m1){
                return "["+m1+"]"
            })

            _log("pre tests for v = ", v)
            //try as part of object
            _log("extraData\n-----\n",extraData)
            try{
                if (eval("obj."+v) !=undefined)
                    tmp = (!justText) ? eval("obj."+v) : "obj."+v
            }catch(e){
            }
            //try as part of extraData
            try{
                
                if (tmp == undefined){
                    if (eval("extraData."+v) !=undefined)
                        tmp =(!justText) ? eval("extraData."+v) : "extraData."+v
                }
            }catch(e){
            }
            //must be false
            if (tmp == undefined)
                tmp = false


            
            return tmp
        }

        var newCommands = {
            
            comment: {
                cmd: "!--",
                endCmd: "--",
                evaluate: function(data){
                    return ""
                }
            },
            setPartial: {
                cmd: "#setPartial",
                endCmd: "/setPartial",
                evaluate: function(data){
                    //_log("setting partial!",data)
                    extraData._partials[data.results.cmdArgs]=data.all;
                    return ""
                }
            },
            replace: {
                cmd: '#replace',
                cmdRegex: /(.+),(.+),(.*)/, //arg1: text, arg2: to replace, arg3: replace with
                evaluate: function(data){
                    var text = eval(swapForTrueVars(data.results.cmdMatches[1]))
                    var regexReplace = new RegExp(data.results.cmdMatches[2], 'g')
                    return text.replace(regexReplace,data.results.cmdMatches[3])
                }
            },
            partial: {
                cmd: "#partial",
                cmdRegex: /\s*(.+)\s*,\s*(.+)\s*/,
                evaluate: function(data){
                    var partialId = data.results.cmdMatches[1]
                    var objString = data.results.cmdMatches[2]
                    if (extraData._partials[partialId]!=undefined){
                        _log("running partial:",partialId,extraData._partials[partialId])
                        return that.simpleTmplParser(extraData._partials[partialId],getVar(objString),extraData, true)
                    }else{
                        return ""
                    }
                }
            },
            log: {
                cmd: "#log",
                evaluate: function(data){
                    data.results.cmdArgs = data.results.cmdArgs.replace(/(^|\s)\$([^\s]+)/g, function(m){
                        return JSON.stringify( getVar(m[2]))
                    })
                    _log("SOULPATCH LOG: "+data.results.cmdArgs)
                    return ""
                }
            },
            join: {
                cmd: "#join",
                cmdRegex: /\s*([^,]+)\s*(?:,\s*(.+))?/, //arg1: , arg2: delimiter
                evaluate: function(data){
                    var el = data.results.cmdMatches[1]
                    var delimiter = data.results.cmdMatches[2]
                    _log("joining:",swapForTrueVars(el))
                    return eval(swapForTrueVars(el)).join(delimiter)
                }
            },
             If: {
                cmd: "#if",
                endCmd: "/if",
                extraSegments: "elif*,else", //do * for multiple?
                //helperEvaluate: ["#if:args", "if:data", else:data"], //rework the helper args
                evaluate: function(data){ //results

                    var segments = data.segments
                    var test
                    var returnText = ""
                    if (returnText=="" && segments["#if"]){
                        _log("segments found", swapForTrueVars(segments["#if"].cmdArgs))
                        test = eval(swapForTrueVars(segments["#if"].cmdArgs))
                        if (test)
                            returnText = segments["#if"].text
                    }

                    if (returnText=="" && segments["elif"]){
                        $.each(segments["elif"], function(k,v){
                            if (returnText == ""){
                                test = eval(swapForTrueVars(v.cmdArgs))
                                if (test)
                                    returnText = v.text
                        
                            }
                        })
                    }

                    if  (returnText=="" && segments["else"]){
                            returnText = segments["else"].text
                    }
                
                    _log("if data from evaluate",data)
                    _log("returnTxt", returnText)
                    return returnText//text to do something to

                }
                 
            },
            each: {
                cmd: "#each",
                endCmd: "/each",
                //as Regex
                cmdRegex: /\s*(.+)\s+as\s+(.+)\s*/,
                evaluate: function(data){
                    //  var tmp =
                      var ret = ""
                      var tmpobj,newExtraData
                      newExtraData = {}
                      var key,val,cmdMatchesPieces
                      
                      if (data.results.cmdMatches){
                          //we have an #each blah as k,v
                         tmpObj = getVar(data.results.cmdMatches[1])

                         if (data.results.cmdMatches[2]){
                             tmpObj = getVar(data.results.cmdMatches[1])
                            cmdMatchesPieces = data.results.cmdMatches[2].split(",")
                            if (data.results.cmdMatches[2].indexOf(",")!=-1){
                                key = cmdMatchesPieces[0].trim()
                                val = cmdMatchesPieces[1].trim()
                            }else{
                                val = data.results.cmdMatches[2].trim()
                            }
                         }
                      }else{
                        //just a #each blah
                        tmpObj = getVar(data.results.cmdArgs)
                      }
                    _log("tmpObj is ", tmpObj)
                    if (tmpObj){
                          var count = 0
                         $.each(tmpObj, function(k,v){
                            newExtraData["this"] = v
                            if (key) newExtraData[key] = k
                            if (val) newExtraData[val] = v
                            newExtraData["$LENGTH"] = ($.isPlainObject(tmpObj)) ? Object.keys(tmpObj).length : (($.isArray(tmpObj)) ? tmpObj.length  : 1)
                            newExtraData["$INDEX"] = Number(count)
                            newExtraData["$COUNT"] = Number(count)+1
                            newExtraData["$LAST"] = ((($.isPlainObject(tmpObj)) ? Object.keys(tmpObj).length : (($.isArray(tmpObj)) ? tmpObj.length  : 1))-1==0)
                            newExtraData["$FIRST"] = (count==0)
                            ret += that.simpleTmplParser(data.results.text,obj,$.extend($.extend({}, extraData),newExtraData),true)
                            count++
                            _log("newExtraData is", newExtraData)
                         })
                    }
                      
                     
                      //_log("each command",data)
                      return ret
                } //<-- end evaluate
            }, //<-- end each
            boldify: {
                cmd: "#boldify",
                evaluate: function(data){
                    return "<b>"+getVar(data.results.cmdArgs)+"</b>"
                }
            },
            underlineify: {
                cmd: "#underlineify",
                evaluate: function(data){
                    return "<u>"+resolveStrToVal(data.results.cmdArgs)+"</u>"
                }
            },
            boldifyContents: {
                cmd: "#boldifyContents",
                endCmd: "/boldifyContents",
                evaluate: function(data){
                    return "<b>"+data.results.text+"</b>"
                }
            },
            trim: {
                cmd: "#trim",
                evaluate: function(data){
                    return resolveStrToVal(data.results.cmdArgs).trim()
                },
            
                helperEvaluate: function(){
                    return "trimmmmmed..."+(arguments[0]).trim()
                }
            }, 
            set: {
                cmd: "#set",
                evaluate: function(data){
                    if (data.results.cmdArgs.indexOf("=")==-1)
                        return ""
                    else{
                        var pieces = data.results.cmdArgs.split("=",2)
                        obj[pieces[0].trim()] = obj[pieces[0].trim()] || {}
                        _log("pieces", pieces)
                        obj[pieces[0].trim()] = resolveStrToVal(pieces[1])
                        return ""
                    }
                }
            },
            jsonify: {
                cmd: "#jsonify",
                evaluate: function(data){
                    _log("woooooop")
                    _log("jsonifying",data.results.cmdArgs," to ",resolveStrToVal(data.results.cmdArgs))
                    return JSON.stringify(resolveStrToVal(data.results.cmdArgs))
                }
            }
        } //<--end new commands

            //setup  helpers automatically from commands..
            $.each(newCommands, function(cmdId,cmd){
                cmd.helperEvaluate = cmd.helperEvaluate || false
                //typ thing 
                //blam(args)
                //blam(args, enclosingData ) - single enclosed
                //blam(argsSeg1, enclosingData, segment1: elif, argSeg1, enclosingData1, segment2:else, argsSeg2,enclosingData2, etc.. ) - segmentEnclosed
                //if we defined it...then use that function
                if (cmd.helperEvaluate && $.isFunction(cmd.helperEvaluate)){
                    extraData._helpers[cmd.cmd] = cmd.helperEvaluate
                //else we will make it automatically
                }else if(cmd.helperEvaluate && $.isString(cmd.helperEvaluate)){
                    //do some crap
                }else{  
                    extraData._helpers[cmd.cmd] =function(){
                        //instantiate extraData._helperArgs
                        extraData._helperArgs = []

                        var text = ""
                        arguments[0] =  arguments[0] || ""
                        arguments[1] =  arguments[1] || ""
                        arguments[2] =  arguments[2] || ""

                        for (var x=0; x<arguments.length; x++){
                            extraData._helperArgs.push(arguments[x])
                        }
                        //here we should check to see if arguments is/contains another helper..
                        //.....
                        text += "{{"+cmd.cmd+" _helperArgs.0}}"
                        //check if endCmd and no segments
                        if (cmd.endCmd && (cmd.extraSegments == undefined || cmd.extraSegments == false)){
                            text += arguments[1]
                        }else if (cmd.endCmd && cmd.extraSegments){
                            //has segments lets check each argument and make a thing for it 
                            
                            //enclosingData
                            text += arguments[2]
                            for (var x=3; x<arguments.length; x+=3){
                                //ex: 3. segmentName
                                if (cmd.extraSegments.split().indexOf(x.trim())!=-1){
                                    //args
                                    arguments[x+1] = arguments[x+1] || ""
                                    //enclosing data
                                    arguments[x+2] = arguments[x+2] || ""
                                    text += "{{"+x.trim()+" "+arguments[x+1]+"}}"
                                    text += (arguments[x+2]) 
                                }
                            }
                            

                        }
                        if (cmd.endCmd){
                            //end tag
                            text+= "{{"+cmd.endCmd+"}}"
                        }
                        _log(extraData._helperArgs)
                        _log(("text from "+cmd.cmd+":"),text)
                        //check if segments

                        var RET =  that.simpleTmplParser(text, obj, extraData,true )
                        //delete extraData._helperArgs
                        return RET
                    }
                }
                
            })

            //1: cmdStr, 2:cmdText
            var commandRegex = /\{\{\s*([^\}\s]+)\s*([^\}]+)*\s*\}\}/
            var hbRegex = /\{\{\s*(.+)\s*\}\}/
            var noMoreCommands = false
            var commandMatch 
            var newText = text

            //escape brackets
            obj = toggleEscapeBracketsinObj(obj, "escape")
            while (noMoreCommands == false){
                noMoreCommands = true
                
                    if (commandMatch = commandRegex.exec(text)){
                        _log("m[1] = "+commandMatch[1])
                        if (commandMatch){
                            var cmdFound = false
                            var RESULT = ""
                            var parseData
                            $.each(newCommands, function(k,cmd){
                                _log(cmd.cmd + " = " + commandMatch[1] + "?")
                                //found a handlebar and a command
                                
                                if (that.safeTrim(cmd.cmd)==commandMatch[1] && cmdFound == false){
                                    _log("read as a cmd?")
                                    
                                    parseData = parseCmd(text, cmd)
                                    _log("\n-----\n")
                                    _log(parseData)
                                    
                                    RESULT = that.simpleTmplParser(cmd.evaluate(parseData),obj,extraData,true)
                                
                                    
                                    _log("new text\n-----\n"+text+"\n---end new text--\n")
                                    
                                    cmdFound = true
                                    noMoreCommands = false
                                }
                                
                            }) //<-- END COMMAND FINDER
                            

                            //no command found (is it a variable?)
                            //else ignore it and remove it
                            if (cmdFound == false){
                                parseData = {
                                    positions: {
                                        start: {
                                            inclusive: commandMatch.index
                                        },
                                        end: {
                                            inclusive:  commandMatch.index+commandMatch[0].length
                                        }
                                    }
                                }
                                var insides = hbRegex.exec(commandMatch[0])
                                _log("BAMBAM INSIDES:", insides, "current RESULT:", RESULT)
                                //is it a variable?
                                if (getVar(insides[1])!=undefined && getVar(insides[1])!=false){
                                        _log("BAMBAM: read as a variable? '"+getVar(insides[1])+"'")
                                        RESULT = getVar(insides[1])
                                }//try returning the text
                                 else{
                                        try{
                                            _log("BAMBAM:",extraData,insides[1]," = ",swapForTrueVars(insides[1]))
                                            RESULT = (resolveStrToVal(insides[1]))
                                            _log("BAMBAM RES-->:",RESULT)
                                        }catch(e){
                                            for (var prop in e) 
                                            {  
                                               vDebug += "property: "+ prop+ " value: ["+ err[prop]+ "]\n"; 
                                            } 
                                            _log("unknown cmd. stripping..")
                                            
                                            _log("Parse Exception  --> "+e)
                                            _log("Stack:",e.stack)
                                        }   
                                }
                                noMoreCommands = false
                                    
                            }
                            _log("woop")
                            text  = text.slice(0, parseData.positions.start.inclusive)+
                            RESULT+
                            text.slice(parseData.positions.end.inclusive)
                            
                        }
                        
                        
                    }

                if (noMoreCommands==true){
                        if (!intermParse){
                            text = toggleEscapeBracketsinObj(text, "unescape")
                        }
                        return text
                }
            }

        
    } //<-- END SOULPATCH

    this.ParentheticalMayhem = function(str,opts){
    this.opts = opts || {}
    this.opts = $.extend(true, {
      //one can change the regex to match other things
      openRegex:  /([^,\s]+?|\s?)\(/,
      delimiterRegex: /,/,
      closeRegex: /\)/,
      debugMode: false,
      commandParsingLimit: 0, //0 = unlimited commands, #= will parse until the limit is met
      disableSuffixContentParsing: false, //if true suffixcontent will not be parsed (left as string)
      //we map out additional parameters for each object
      mapper: function(openMatches, delimiterMatches, closeMatches, preText,suffixContent){
        return {}
      }
    },this.opts)



    this.resultObject = {}

    //load new string in
    this.load = function(str){
      this._log("loading string..\"",str,"\"")
      if (str!=undefined)
        this.resultObject = this.parseString(str)
    }
    //return result
    this.getResultObject = function(){
      if (typeof this.resultObject == "string")
        return this.resultObject
      else
        return $.extend(true,{},this.resultObject)
    }

    //how to format given some rules
    this.toTextFormat = function( rules, resultObj, nestLevel){
      var that = this
      //default rules
      var rules = rules || {}
      var resultObj = resultObj || this.getResultObject()
      var nestLevel = (nestLevel!=undefined) ? nestLevel : 0
      var rules =  $.extend(true,{
        plainText: function(nestLevel, text){
          return text
        },
        preText: function(nestLevel, pretext){
          return pretext
        },
        suffixContent: function(nestLevel, suffixContent){
          return suffixContent
        },
        commands: {
          _default: function(nestLevel, resultObj,_self){

            return resultObj.command+"("+resultObj.args.join(", ")+")"
          }
        }
      },rules)

      var returnString = ""
      if (typeof resultObj == "string"){
        returnString = rules.plainText(nestLevel, resultObj)
      }else{
        //this is an object, add to nest level
        nestLevel++
        
            if (resultObj.preText!=undefined){
              returnString+=rules.preText(nestLevel, resultObj.preText)
            }
            
            if (resultObj.command!=undefined){
              var commandRule = (rules.commands[resultObj.command]!=undefined) ? rules.commands[resultObj.command] : rules.commands["_default"]
              $.each(resultObj.args, function(k2, obj2){

                if (typeof obj2 != "string"){
                   //go through each and run this shite on it to get text versions
                  resultObj.args[k2] = that.toTextFormat(rules, obj2,nestLevel)
                }
              })
              returnString+=commandRule(nestLevel, resultObj,commandRule)
            }
           
            if (resultObj.suffixContent!=undefined){
             if (typeof resultObj.suffixContent != "string"){
                resultObj.suffixContent = that.toTextFormat(rules, resultObj.suffixContent, 0)
              }
                returnString+=rules.suffixContent(nestLevel, resultObj.suffixContent)
            }
      }

      return returnString
    }

    this._log = function(){
      if (this.opts.debugMode){
        console.log.apply(null,arguments)
      }

    }

    //check command limit
    this.withinCommandLimit = function(commandLevel){
      if (this.opts.commandParsingLimit>0){
        //if current command count is less then limit
        return (this.opts.commandParsingLimit>commandLevel)
      }else{
        return true
      }
    }
    //parse string to resultObject
    this.parseString = function(val,commandLevel){
     var origVal = val
          var that = this
          var parenDic = {
            open: {
               regex: that.opts.openRegex
            },
            comma: {
              regex: that.opts.delimiterRegex
            },
            close: {
              regex: that.opts.closeRegex
            }
          }
          var commandLevel = commandLevel || 1
          var commandFound = true
          var nestedIndex = 0
          var nextPosition = 0
          var lastArgPosition = 0
          var absoluteIndex = 0


          //for mapper
          var mapperData = {
            openMatches: [],
            closeMatches: [],
            delimiterMatches: [],
            preText: "",
            suffixContent: "",
            args: []
          }
          var resultObj = {
            preText: "", //text before first found command
            command: "",
            args: [],
            suffixContent: "" //text/object after first found command
          }
          while (commandFound == true){
 
             commandFound = false
             //lets see which is th next occurring 
              var closestMatch = false
              var parenType = false
              var closestIndex = -1
              $.each(parenDic, function(_parenType,parenObj){
                  if (parenObj.regex){
                     if(m = parenObj.regex.exec(val)){

                        if (m.index<closestIndex || closestIndex==-1){
                          //store that stuff
                          closestMatch = m
                          parenType = _parenType
                          closestIndex = m.index
                        }
                     }else{
                      that._log(_parenType,": no matches :(")
                     }
                  }
               })
              //we now have closest match to beginning [open,arg, or close],now lets parse
              if(closestMatch){
                   nextPosition = closestMatch.index+closestMatch[0].length
                   absoluteIndex += nextPosition
                   this._log("-----------------")
                   this._log("match for  "+parenType+"..")
                   this._log("match found!", parenType, closestMatch)
                   this._log("lastArgPosition:",lastArgPosition)
                   this._log("absolute index:",absoluteIndex)
                   this._log("nextPosition",nextPosition)
                   this._log("absolute text from here:", origVal.substring(absoluteIndex))
                   this._log("nested index:",nestedIndex)
                   if (parenType=="open"){
                     //beginning of command
                    if (nestedIndex==0){
                      resultObj.preText = origVal.substring(0,closestMatch.index)
                      mapperData.preText = resultObj.preText
                      mapperData.openMatches = closestMatch 
                      resultObj.command = closestMatch[1] || ""
                      lastArgPosition = absoluteIndex
                     }
                    nestedIndex++
                   }else if (parenType=="comma" && nestedIndex==1){
                      var arg = origVal.substring(lastArgPosition,absoluteIndex-closestMatch[0].length) //-1 to remove comma
                      this._log("new arg!:",arg)
                      mapperData.delimiterMatches.push(closestMatch)
                      //------middle arg-------
                      if (this.withinCommandLimit(commandLevel))
                        resultObj.args.push(this.parseString(arg, commandLevel+1))
                      else
                         resultObj.args.push(arg)
                       //---end middle arg------
                      lastArgPosition = absoluteIndex
                   }else if (parenType=="close"){
                    nestedIndex--
                    this._log("close found nestedIndex now:",nestedIndex)
                     //end of command
                    if (nestedIndex==0){
                     resultObj.suffixContent = origVal.substring(absoluteIndex)
                     //parse suffix content if not disabled
                     if (!this.opts.disableSuffixContentParsing){
                        resultObj.suffixContent = this.parseString(resultObj.suffixContent, commandLevel)
                     }
                     mapperData.suffixContent = resultObj.suffixContent
                     this._log("suffix content:",resultObj.suffixContent)
                     var arg = origVal.substring(lastArgPosition,absoluteIndex-closestMatch[0].length) //-1 to remove )
                     this._log("new arg!:",arg)

                     mapperData.closeMatches = closestMatch
                     //mapperData.delimiterMatches.push(closestMatch)
                     //----last arg-----
                     if (this.withinCommandLimit(commandLevel))
                      resultObj.args.push(this.parseString(arg, commandLevel+1))
                    else
                       resultObj.args.push(arg)
                     //----end last arg---
                     this._log("mapperData:",mapperData)
                     mapperData.args = $.extend(true, {}, resultObj.args)
                     //merge extra content from mapper
                    var extraVals = this.opts.mapper(mapperData)
                    $.extend(true, resultObj, extraVals)

                     //<------post clean up----->
                
                      //remove suffix or pre
                      var keys = ["suffixContent", "preText"]
                     for (var i in keys){
                        key = keys[i]
                        if (typeof resultObj[key] == "string" && resultObj[key].replace(/[\n\r\s]+/g, '')=="")
                          delete resultObj[key]
                      }
                      //if something in extravals was set to undefined..then delete from result obj
                      $.each(extraVals, function(k,v){
                        //if in result obj
                        if (resultObj[k]!=undefined){
                          //if this key is set at undefined
                          if (v==undefined){
                            //then delete resultObj object
                            delete resultObj[k]
                          }
                        }
                      })
                      //<---end clean up---->
                     return resultObj
                    }
                   }
                   val = val.substring(nextPosition)
                    commandFound = true

                }
          }
          return origVal 
  
  } //<--end parsestring function
  this.load(str)
}

    
    this.init()

}

//polyfills
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

