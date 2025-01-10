/* ************************************************************************** */
/*   Copyright 2025 <Sysify>                                                  */
/*                                                                            */
/*   File    : index.ts                                                       */
/*   Project : Sysify                                                         */
/*   License : MIT                                                            */
/*                                                                            */
/*   Created: 2025/01/07 13:37:00 by aallali                                  */
/*   Updated: 2025/01/11 01:00:35 by aallali                                  */
/* ************************************************************************** */

import { FileSystem } from './fileSystem'
 
const main = () => {
	const fs = new FileSystem()

	fs.cd('/')
	fs.cd('../')
	try {
		fs.cd('src/')
	} catch { /* empty */ }
}

// Run the main function
main()
