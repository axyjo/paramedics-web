#ifndef COMMANDCENTER_H
#define COMMANDCENTER_H

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include "state.h"
#include "command.h"
#include "logger.h"


class CommandCenter {
	std::unordered_map<std::string, std::string> file_map;
	std::unordered_map<std::string, std::unique_ptr<Command>> command_map;
	std::shared_ptr<State> state;
	std::unique_ptr<Command> makeCommand(const std::vector<std::string>& cmd_vec);
	std::string getFile(std::string file);
	void setFile(std::string key, std::string val);
	const std::unique_ptr<Command>& getCommand(std::string cmd);
	void setCommand(std::string key, std::unique_ptr<Command> cmd);
	void initializeFileMap();
	void initializeCommandMap();
	bool evaluate(const std::unique_ptr<Command>& cmd);

public:
	CommandCenter() = delete;
	CommandCenter(const std::shared_ptr<State>& state);
	~CommandCenter();
	bool executeCommand(std::string cmd);
};

#endif