const Tag = ({title, className}) => {

  return (<p className={`tag ${className}`} dangerouslySetInnerHTML={{ __html: title }} />)
}

export default Tag;
