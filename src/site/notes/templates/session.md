---
{"dg-publish":true,"type":"session","location":null,"date":"<% tp.date.now(\"YYYY-MM-DD\") %>","summary":"","art":"","episode":null,"tags":null,"permalink":"/templates/session/","dgPassFrontmatter":true,"noteIcon":"","created":"2025-10-26T08:08:36.503-07:00","updated":"2025-10-27T13:23:46.322-07:00"}
---

# [[<% tp.file.title %>\|<% tp.file.title %>]]

## Session Summary
> [!tldr] [[<% tp.file.title %>\|<% tp.file.title %>]]
> < write summary here >
>
{ #summary}


---


## Recap
### **<%*
  let target = tp.user.getLastGameTitle(tp);
  target = target.replace(/^\[\[/, '').replace(/\]\]$/, '').split('\|')[0];
  const file = await tp.file.find_tfile(target);
  const fm = app.metadataCache.getFileCache(file)?.frontmatter || {};
  tR += fm.episode ?? "(no episode)";
%>**
![[<% tp.user.getLastGameTitle(tp) %>#^summary\|<% tp.user.getLastGameTitle(tp) %>#^summary]]





---

## AI Summary


## Log
