-- One-off: rename the old product names inside stored blog content.
update BlogPosts set
  Title = replace(replace(Title, 'Popup Manager', 'OptinYeti'), 'PopupX', 'OptinYeti'),
  Content = replace(replace(Content, 'Popup Manager', 'OptinYeti'), 'PopupX', 'OptinYeti'),
  Excerpt = replace(replace(Excerpt, 'Popup Manager', 'OptinYeti'), 'PopupX', 'OptinYeti'),
  MetaDescription = replace(replace(MetaDescription, 'Popup Manager', 'OptinYeti'), 'PopupX', 'OptinYeti'),
  MetaKeywords = replace(replace(replace(MetaKeywords, 'Popup Manager', 'OptinYeti'), 'popup manager', 'OptinYeti'), 'PopupX', 'OptinYeti'),
  Slug = replace(Slug, 'popup-manager', 'optinyeti')
where Title like '%Popup Manager%' or Content like '%Popup Manager%' or Content like '%PopupX%'
   or Slug like '%popup-manager%' or Excerpt like '%Popup Manager%' or MetaDescription like '%Popup Manager%';
select Id, Slug, Title from BlogPosts;
