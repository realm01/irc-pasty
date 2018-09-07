[![Build Status](https://travis-ci.org/realmar/irc-pasty.svg?branch=master)](https://travis-ci.org/realmar/irc-pasty)
[![Coverage Status](https://coveralls.io/repos/github/realmar/irc-pasty/badge.svg?branch=master)](https://coveralls.io/github/realmar/irc-pasty?branch=master)
Pasty
=====
Pasty is a modern irc pastebot featuring material design.

It has the following features:
  - Text can be formatted as
    - markdown
    - code block
    - plain text
  - ACE text editor with VIM bindings
  - Autosave
  - Overview of all posts (chronological)
    - Posts can be deleted
  - Automatically post to an IRC server
    - TLSv1.2 support
    - Use channel keys
    - Use server password
  - Beautiful material design
  - Mobile optimized
  - Command line client
  - Posts are plain text files
    - which reside in a chronological folder structure
  - Save submitters username when using apache2's auth (or setting the `REMOTE_USER` environment variable)
  - File upload

Images
------
### Syntax highlighting
<img src="doc/images/md-hightlighted.png" width="70%" alt="Syntax Highlighting">
### Mobile compatible
<img src="doc/images/mobile.png" width="70%" alt="Mobile Compatible">

Requirements
------------
### CMD client
```sh
$ pip install requests
```

### Server
```sh
$ pip install -r requirements.txt
```

Compatibility
-------------
python2

Pasty can be used by any modern web browser. The command line client is compatible with Linux, Mac OS as well as with windows. Although the pasty server is designed to run only on Linux or Mac OS. (I may add windows support later)

### python3
Pasty server currenty does _not_ support python3 because it uses `irc` from `twisted.words.protocols` which is currenty not available in python3. If twisted ports its `irc` words to python3 I will also add support for python3.

Deployment
----------
### CMD client
Create a `.pasty.conf` file in your home directory and specify the pasty server as well as the default channel to which should be posted:
```sh
server: https://your.pasty.server.example.com
channel: '#example-channel'
```

Use `pasty --help` for more information about the cmd tool.

### Server
Configure the server:
```sh
# FILE: pasty_server.conf
---
pasty:
  url: <service-url>

irc:
  server: <irc-hostname>
  port: 6667
  encryption: TLS|None    # can be omitted if None is choosen
  username: <username-of-pasty>
  channels:
    - name: '#<channel1>'
      key: somekey
    - name: '#<channel2>'
      key: None           # can be omitted if None is choosen
```

For more information about the configuration parameters take a look at the `.EXAMPLE` configuration file.

To run the server you can simply run `python web.py` but for a production environment I recommend you to use a web server which serves pasty as `wsgi`: (eg. apache)
```xml
DocumentRoot <pasty-root-dir>

WSGIDaemonProcess pasty user=www-data
WSGIScriptAlias / <pasty-root-dir>/web.wsgi

<Directory <pasty-root-dir>
        WSGIProcessGroup pasty
        WSGIApplicationGroup %{GLOBAL}
        require all granted
</Directory>
```

Continuous Integration
----------------------
I have travis and coveralls set up to do continuous integration. I solely perform integration tests which test the flask routes and their behavior. (using `nose`)

### Run the test suite
```sh
# Python

$ coverage run setup.py test
# or
$ nosetests

# JavaScript (not in CI)

$ grunt test -v
```

Contributing
------------
I welcome all contributions.

Please take a look at my coding style (variable names, class names etc.) and use the same style. For all pull requests: never develop directly in the master branch! Create a branch whose name suits your feature or bug fix.
Also don't forget to write tests or adapt existing tests.

Technical Documentation
-----------------------
You can generate documentation for every modul, class and function using the `Makefile` in `doc/`. (Powered by Sphinx)

```sh
$ make html

# and then open it in a webbrowser
$ google-chrome build/html/index.html
```

LICENSE
--------
> Pasty is a pastebot Copyright (C) 2016 Anastassios Martakos
>
> This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by > the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
>
> This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

> You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
