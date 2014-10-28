# Javascript templating engine.

Require module for parsing html files to plain Javascript. There is two environments, one Development another production.

## Why Templating Engine

Most javascript templating engines, parsing to string. Domtemplate has dom elements or require modules. You has direct access to Dom elements. In this case no need for jquery selectors etc.

## How it works

Below is image to show difference between prod and dev packages.

![Prod Dev Packages Diagram](https://bitbucket.org/gunsim/domtemplate/raw/master/docs/images/prod_dev.jpg)

In the development Environment you use runtime version of package, which one parse on browser. For Production you use compiled app version, where is no need for parser and coder.

## Prerequisites

You need to install [**nodejs**](http://nodejs.org/) and **grunt CLI** globally `npm -g install grunt-cli`

## How to install

Run

> npm install

Then

> grunt

## How to use
Usage examples see in examples section.

Fix paths in require.config file

### Templating parser use custom coders

**Component** - `<cp></cp>` use for require modules

> `<cp src="buttonA/buttonA" tp-name="testButton" ></cp>`

#### Where

- `src` is location of require Module
- `tp-name` name of component.
There also can be shortcut version

> `<cp-testButton src="buttonA/buttonA" ></cp-testButton>`

-`cp-testButton` where `testButton` is the name of component

There can be used by only attributes as well

> `<div src="buttonA/buttonA" tp-type="cp" tp-name="testButton" ></div>`


**Placeholder** - `<pl></pl>` use as containers in template, also can use in javascript as access to elements

> `<pl tp-name="testButton" tp-tag="h2" ></pl>`

#### Where

- `tp-name` name of Placeholder.
- `tp-tag` tag of Placeholder, default value is `div`.

There also can be shortcut version

> `<pl-header ></pl-header>`

- `pl-header` where `header` is the name of placeholder

There can be used by only attributes as well

> `<h2 tp-type="pl" tp-name="header" ></h2>`

