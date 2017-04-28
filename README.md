# hubot-servicenow-tickets

Hubot enriches your discussions of servicenow tickets.

```
wilfred> You need to be careful, or you end up with CR1234
Hubot> CR1234: System has turned sentient (22 Sep 2029) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1234
```

<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-generate-toc again -->
**Table of Contents**

- [hubot-servicenow-tickets](#hubot-servicenow-tickets)
    - [Installation](#installation)
    - [Plugins available](#plugins-available)
        - [hubot-servicenow-tickets/mentions](#hubot-servicenowmentions)
        - [hubot-servicenow-tickets/find](#hubot-servicenowfind)
        - [hubot-servicenow-tickets/users](#hubot-servicenowusers)
        - [hubot-servicenow-tickets/clone](#hubot-servicenowclone)
        - [hubot-servicenow-tickets/debug](#hubot-servicenowdebug)
        - [hubot-servicenow-tickets/frontend](#hubot-servicenowfrontend)

<!-- markdown-toc end -->

## Installation

Install from npm:

```
$ npm install hubot-servicenow-tickets --save
```

Configure your Hubot to use this plugin by adding your desired scripts
to external-scripts.json:

```
$ cat ./external-scripts.json
[
  "hubot-servicenow-tickets/clone",
  "hubot-servicenow-tickets/debug",
  "hubot-servicenow-tickets/find",
  "hubot-servicenow-tickets/frontend",
  "hubot-servicenow-tickets/mentions",
  "hubot-servicenow-tickets/users"
]
```

Add a servicenow.yaml that lists your servicenow instance URL, plus the
tickets that you're interested in:

``` yaml
root_url: https://servicenow.example.com

# A list of servicenow tables that we're interested in. To find the
# name of a table, look carefully at URLs in servicenow's web API. If
# the 'create new change' link is
# 'https://servicenow.example.com/change_request.do?...' then the table name is
# 'change_request'.
#
# There's also a useful list of tables at
# http://wiki.servicenow.com/index.php?title=Tables_and_Classes
tables:
  # The most common table to configure.
  - name: "change_request"
    prefix: "CR"
    # Used for showing a summary and sorting search results
    # (if not specified, uses 'sys_created_on').
    date_field: "end_date"

  # If you have custom tables in your servicenow instance, you can use
  # those too!
  - name: "u_example_cake"
    prefix: "YUM"
    date_field: "u_bake_completed"
```

Finally, you need to configure credentials used by Hubot. We use
environment variables:

```bash
$ export HUBOT_SERVICENOW_USER='myusername'
$ export HUBOT_SERVICENOW_PASSWORD='secretpassword'

# If you're using custom HTTPS certificates, you may also need:
$ export NODE_TLS_REJECT_UNAUTHORIZED='0'

# And if you depend on a proxy to access the web:
$ export http_proxy=http://proxyuser:secretpassword@myproxy.example.com
```

## Plugins available

### hubot-servicenow-tickets/mentions

The mentions plugin will make Hubot respond to any mention of
servicenow ticket types that you have configured in servicenow.yaml.

```
wilfred> You need to be careful, or you end up with CR1234
Hubot> CR1234: System has turned sentient (22 Sep 2029) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1234
```

### hubot-servicenow-tickets/find

The find plugin allows you to search for servicenow tickets, based on
content or creator.

```
wilfred> @Hubot created by wilfred
Hubot> CR1002: Upgrade foo to v3 (3 March 2011) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1002
CR1000: Upgrade bar (1 Jan 2010) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1000
wilfred> @Hubot find foo
Hubot> CR1002: Upgrade foo to v3 (3 March 2011) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1002
CR1001: install foo v1 (20 November 2010) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1001
```

If you have the users plugin enabled, you can also do:

```
wilfred> @Hubot created by me
Hubot> CR1002: Upgrade foo to v3 (3 March 2011) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1002
CR1000: Upgrade bar (1 Jan 2010) https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR1000
```

### hubot-servicenow-tickets/users

The users plugin associates chatroom usernames with servicenow
usernames.

```
Wilfred> @Hubot known users
Hubot> I know 1 username:
John -- jsmith
To add your username:
@ServiceNow my username is yourusernamehere
Wilfred> @Hubot my username is whughes
Hubot> OK, saved.
```

### hubot-servicenow-tickets/clone

*The clone plugin requires the users plugin.*

The clone plugin allows you to create tickets where all the fields are
the same as another ticket.

This is useful when you have an old CR 'install v1.1 of project foo'
and you want to write a very similar CR 'install v1.2 of project foo'.

```
Wilfred> @Hubot clone CR1234
Hubot>  Success! CR5201 created: https://servicenow.example.com/nav_to.do?uri=change_request.do?sys_id=CR5201
Amend your instructions, set the date, then submit!
```

To clone a ticket, you need to configure the bot to say which fields
you want to set in your copy. For example, if we want to support
cloning CRs:

``` yaml
  - name: "change_request"
    prefix: "CR"
    clone_fields:
      # Text fields that are specific to each CR, so the user will usually need to amend.
      - short_description
      - description
      - change_plan
      - test_plan
      - backout_plan
      # Fields that are typically the same for every CR for a given project.
      - risk
      - reason
      - production_system
      - category
      - impact
      - assignment_group
      # These fields are also constant for all CRs for a project, but they often affect which
      # groups are required for approval.
      - type
```

If you're not sure what name to use for field, just open the
servicenow website and inspect the input. For example,
`<input name="sys_display.change_request.requested_by" type="text">`
indicates that the 'Requested By' field is called `requested_by`.

### hubot-servicenow-tickets/debug

The debug plugin dumps tickets, so you can see the raw data.

```
Wilfred> @Hubot dump CR1234
Hubot>  {
  "active": false,
  "activity_due": "",
  "approval": "approved",
...
}
Wilfred> @Hubot dump CR1234 approval
Hubot> "approved"
```

### hubot-servicenow-tickets/frontend

The frontend plugin provides a stripped-down read-only web frontend,
as an alternative to the default servicenow UI.

**Simpler**: It only shows the fields you've requested, and only if
they have values for the current ticket. If users just enter 'N/A' or
'None', we don't bother showing it.

**Cross-referenced**: It converts text like `http://...` and `CR...`
to hyperlinks, and provides a deep link to the relevant page on your
servicenow instance.

![web screenshot](hubot_servicenow_frontend.png)

You need to specify which fields you want to display in your
servicenow.yaml:

``` yaml
tables:
  - name: "change_request"
    prefix: "CR"
    date_field: "end_date"
    web_fields:
      # Use a title of 'Prerequisites'
      - Prerequisites:
          # And render this ticket field under than heading.
          - u_pre_requisites
      - Instructions:
          - change_plan
      - Rollback:
          # We can specify multiple fields under a single heading.
          - u_pre_requisites_bp_
          - backout_plan
```

