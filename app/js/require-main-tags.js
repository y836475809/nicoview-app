
const requireMainTags = (app_base_dir) => {
    require(`${app_base_dir}/tags/split-page-templete.tag`); 
    require(`${app_base_dir}/tags/accordion.tag`);
    require(`${app_base_dir}/tags/pagination.tag`);
    require(`${app_base_dir}/tags/modal-dialog.tag`);
    
    require(`${app_base_dir}/tags/library-page.tag`);
    
    require(`${app_base_dir}/tags/search-page.tag`);
    
    require(`${app_base_dir}/tags/download-schedule-dialog.tag`);
    require(`${app_base_dir}/tags/download-page.tag`);
    
    require(`${app_base_dir}/tags/play-history.tag`);
    
    require(`${app_base_dir}/tags/preference-page.tag`);
      
    require(`${app_base_dir}/tags/mylist-page.tag`);
};

module.exports = requireMainTags;
